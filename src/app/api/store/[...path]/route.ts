import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db, sqlite } from "@/server/db";
import { currentUser } from "@/server/auth";
import {
  products,
  variants,
  orders,
  addresses,
  user,
  wishlists,
  enquiries,
  settings,
} from "@/server/schema";
import {
  authorizeAdmin,
  StoreError,
  quoteCart,
  createOrder,
  getOrder,
  getProducts,
  getSettings,
  updateOrderStatus,
  adminMetrics,
  customerOrders,
} from "@/server/store";
import { checkWriteRequest, errorResponse } from "@/server/http";
import { productSchema, shippingSchema } from "@/lib/validation";
import { filterProducts } from "@/lib/filter";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  try {
    const { path } = await context.params;
    const route = path.join("/");
    const method = request.method;
    const url = new URL(request.url);
    if (method !== "GET") checkWriteRequest(request);
    if (method === "GET" && route === "products")
      return NextResponse.json(
        filterProducts(getProducts(), Object.fromEntries(url.searchParams)),
      );
    if (method === "GET" && route === "settings")
      return NextResponse.json(getSettings());
    if (method === "POST" && route === "cart/quote")
      return NextResponse.json(quoteCart((await request.json()).items));
    if (method === "POST" && route === "checkout") {
      const actor = await currentUser();
      return NextResponse.json(createOrder(await request.json(), actor?.id), {
        status: 201,
      });
    }
    if (method === "POST" && route === "contact") {
      const input = z
        .object({
          name: z.string().trim().min(2).max(100),
          email: z.email().max(200),
          message: z.string().trim().min(10).max(3000),
        })
        .parse(await request.json());
      const id = randomUUID();
      db.insert(enquiries)
        .values({ ...input, id, createdAt: Date.now() })
        .run();
      return NextResponse.json(
        {
          id,
          message:
            "Your enquiry has been saved for the store team. This demo does not send email.",
        },
        { status: 201 },
      );
    }
    const actor = await currentUser();
    if (method === "GET" && path[0] === "orders" && path.length === 2)
      return NextResponse.json(
        getOrder(
          path[1],
          actor?.id ?? null,
          url.searchParams.get("access") || undefined,
        ),
      );
    if (path[0] === "admin") {
      authorizeAdmin(actor);
      if (method === "GET" && route === "admin/overview")
        return NextResponse.json({
          metrics: adminMetrics(),
          products: getProducts(true),
          orders: db
            .select()
            .from(orders)
            .orderBy(desc(orders.createdAt))
            .all()
            .map((row) => getOrder(row.id, actor!.id, undefined, true)),
          enquiries: db
            .select()
            .from(enquiries)
            .orderBy(desc(enquiries.createdAt))
            .all(),
          settings: getSettings(),
        });
      if ((method === "POST" || method === "PUT") && path[1] === "products") {
        const input = productSchema.parse(await request.json());
        const id = method === "PUT" ? path[2] : randomUUID();
        if (!id) throw new StoreError("Missing product ID.");
        const existing = db
          .select()
          .from(products)
          .where(eq(products.id, id))
          .get();
        if (method === "PUT" && !existing)
          throw new StoreError("Product not found.", 404);
        sqlite
          .transaction(() => {
            const { variants: skus, ...fields } = input;
            const row = {
              ...fields,
              id,
              image:
                existing?.image ||
                `/products/${input.category.toLowerCase()}-generic.svg`,
              model: input.category.toLowerCase(),
              createdAt: existing?.createdAt || Date.now(),
            };
            if (existing)
              db.update(products).set(row).where(eq(products.id, id)).run();
            else db.insert(products).values(row).run();
            const combinations = new Set<string>();
            for (const sku of skus) {
              const combination = `${sku.size}:${sku.color}`;
              if (combinations.has(combination))
                throw new StoreError("Duplicate size and colour combination.");
              combinations.add(combination);
              const previous = db
                .select()
                .from(variants)
                .where(eq(variants.sku, sku.sku))
                .get();
              if (previous && previous.productId !== id)
                throw new StoreError("SKU belongs to another product.");
              if (
                previous &&
                (previous.size !== sku.size || previous.color !== sku.color)
              )
                throw new StoreError(
                  "Existing SKU size and colour are immutable. Add a new SKU for a new combination.",
                );
              if (previous)
                db.update(variants)
                  .set({ stock: sku.stock, colorHex: sku.colorHex })
                  .where(eq(variants.sku, sku.sku))
                  .run();
              else
                db.insert(variants)
                  .values({ ...sku, productId: id })
                  .run();
            }
          })
          .immediate();
        return NextResponse.json({ id });
      }
      if (method === "POST" && path[1] === "orders" && path[2]) {
        const input = z
          .object({
            status: z.enum(["confirmed", "shipped", "delivered", "cancelled"]),
          })
          .parse(await request.json());
        updateOrderStatus(path[2], input.status);
        return NextResponse.json({ updated: true });
      }
      if (method === "PUT" && route === "admin/settings") {
        const input = z
          .object({
            currency: z.string().regex(/^[A-Z]{3}$/),
            language: z.string().min(2).max(30),
            timezone: z.string().min(2).max(60),
            shippingFee: z.number().int().min(0).max(10000000),
            freeShipping: z.number().int().min(0).max(100000000),
            email: z.email(),
            phone: z.string().min(7).max(30),
            address: z.string().min(8).max(250),
            delivery: z.string().min(10).max(2000),
            returns: z.string().min(10).max(2000),
          })
          .parse(await request.json());
        try {
          new Intl.NumberFormat(input.language, {
            style: "currency",
            currency: input.currency,
          }).format(1);
          new Intl.DateTimeFormat(input.language, { timeZone: input.timezone });
        } catch {
          throw new StoreError("Invalid language, currency or timezone.");
        }
        sqlite
          .transaction(() => {
            for (const [key, value] of Object.entries(input))
              db.insert(settings)
                .values({ key, value: JSON.stringify(value) })
                .onConflictDoUpdate({
                  target: settings.key,
                  set: { value: JSON.stringify(value) },
                })
                .run();
          })
          .immediate();
        return NextResponse.json({ updated: true });
      }
      throw new StoreError("Not found.", 404);
    }
    if (!actor) throw new StoreError("Sign in to continue.", 401);
    if (method === "GET" && route === "account")
      return NextResponse.json({
        user: {
          id: actor.id,
          name: actor.name,
          email: actor.email,
          role: actor.role,
        },
        addresses: db
          .select()
          .from(addresses)
          .where(eq(addresses.userId, actor.id))
          .all(),
        orders: customerOrders(actor.id).map((row) =>
          getOrder(row.id, actor.id),
        ),
      });
    if (method === "PUT" && route === "profile") {
      const input = z
        .object({ name: z.string().trim().min(2).max(100) })
        .parse(await request.json());
      db.update(user)
        .set({ name: input.name, updatedAt: new Date() })
        .where(eq(user.id, actor.id))
        .run();
      return NextResponse.json({ updated: true });
    }
    if (method === "POST" && route === "addresses") {
      const input = shippingSchema
        .omit({ email: true })
        .extend({ label: z.string().min(2).max(40), id: z.string().optional() })
        .parse(await request.json());
      const { id: provided, ...fields } = input;
      if (provided) {
        const result = db
          .update(addresses)
          .set(fields)
          .where(
            and(eq(addresses.id, provided), eq(addresses.userId, actor.id)),
          )
          .returning()
          .all();
        if (!result.length) throw new StoreError("Address not found.", 404);
      } else
        db.insert(addresses)
          .values({ ...fields, id: randomUUID(), userId: actor.id })
          .run();
      return NextResponse.json({ updated: true });
    }
    if (method === "DELETE" && path[0] === "addresses" && path[1]) {
      db.delete(addresses)
        .where(and(eq(addresses.id, path[1]), eq(addresses.userId, actor.id)))
        .run();
      return NextResponse.json({ deleted: true });
    }
    if (method === "GET" && route === "wishlist") {
      const ids = db
        .select()
        .from(wishlists)
        .where(eq(wishlists.userId, actor.id))
        .all()
        .map((x) => x.productId);
      return NextResponse.json({ ids });
    }
    if (method === "POST" && route === "wishlist") {
      const input = z
        .object({ productId: z.string().max(100), wanted: z.boolean() })
        .parse(await request.json());
      if (
        !db
          .select()
          .from(products)
          .where(eq(products.id, input.productId))
          .get()
      )
        throw new StoreError("Product not found.", 404);
      if (input.wanted)
        db.insert(wishlists)
          .values({ userId: actor.id, productId: input.productId })
          .onConflictDoNothing()
          .run();
      else
        db.delete(wishlists)
          .where(
            and(
              eq(wishlists.userId, actor.id),
              eq(wishlists.productId, input.productId),
            ),
          )
          .run();
      return NextResponse.json({ updated: true });
    }
    throw new StoreError("Not found.", 404);
  } catch (error) {
    return errorResponse(error);
  }
}
export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
