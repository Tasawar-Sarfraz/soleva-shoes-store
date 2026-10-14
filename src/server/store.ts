import { and, desc, eq, sql } from "drizzle-orm";
import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { db, sqlite } from "./db";
import {
  products,
  variants,
  settings,
  orders,
  orderItems,
  orderEvents,
  user,
} from "./schema";
import { defaultSettings } from "../lib/catalogue";
import { cartSchema, checkoutSchema } from "../lib/validation";
import type { CartLine, Product, Quote, StoreSettings } from "../lib/types";

export class StoreError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function getSettings(): StoreSettings {
  const rows = db.select().from(settings).all();
  return {
    ...defaultSettings,
    ...Object.fromEntries(rows.map((x) => [x.key, JSON.parse(x.value)])),
  };
}
export function getProducts(includeInactive = false): Product[] {
  const rows = db
    .select()
    .from(products)
    .all()
    .filter((x) => includeInactive || x.active);
  const skus = db.select().from(variants).all();
  return rows.map((product) => ({
    ...product,
    variants: skus.filter((v) => v.productId === product.id),
  }));
}
export function getProduct(slug: string) {
  return getProducts().find((p) => p.slug === slug);
}
export function quoteCart(input: CartLine[]): Quote {
  const lines = cartSchema.parse(input);
  const merged = new Map<string, number>();
  for (const line of lines)
    merged.set(line.sku, (merged.get(line.sku) ?? 0) + line.quantity);
  const items = Array.from(merged, ([sku, quantity]) => {
    if (quantity > 10) throw new StoreError("Maximum 10 pairs per SKU.", 409);
    const row = db
      .select({ variant: variants, product: products })
      .from(variants)
      .innerJoin(products, eq(products.id, variants.productId))
      .where(eq(variants.sku, sku))
      .get();
    if (!row || !row.product.active)
      throw new StoreError(
        "One of these products is no longer available. Remove it from your bag.",
        409,
      );
    if (quantity > row.variant.stock)
      throw new StoreError(
        `${row.product.name}, EU ${row.variant.size}, ${row.variant.color}: only ${row.variant.stock} available. Update your bag.`,
        409,
      );
    return {
      sku,
      quantity,
      price: row.product.price,
      name: row.product.name,
      size: row.variant.size,
      color: row.variant.color,
      stock: row.variant.stock,
      image: row.product.image,
    };
  });
  const config = getSettings();
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );
  const shipping = subtotal >= config.freeShipping ? 0 : config.shippingFee;
  return {
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
    currency: config.currency,
    freeShipping: config.freeShipping,
  };
}
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function accessToken(id: string, key: string) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new StoreError(
      "Run npm run setup to configure a secure server secret.",
      503,
    );
  return createHmac("sha256", secret)
    .update(`guest-order:${id}:${key}`)
    .digest("hex");
}
export function createOrder(raw: unknown, userId: string | null = null) {
  const parsed = checkoutSchema.parse(raw);
  const input = {
    ...parsed,
    items: [...parsed.items].sort((a, b) => a.sku.localeCompare(b.sku)),
  };
  const fingerprint = digest(JSON.stringify({ ...input, userId }));
  return sqlite
    .transaction(() => {
      const previous = db
        .select()
        .from(orders)
        .where(eq(orders.idempotencyKey, input.idempotencyKey))
        .get();
      if (previous) {
        if (previous.fingerprint !== fingerprint)
          throw new StoreError(
            "This checkout attempt was already used. Start a new checkout.",
            409,
          );
        return {
          id: previous.id,
          access: accessToken(previous.id, input.idempotencyKey),
          duplicate: true,
        };
      }
      const quote = quoteCart(input.items);
      const id = randomUUID();
      const token = accessToken(id, input.idempotencyKey);
      const { recipient, email, phone, line, city, postal } = input;
      db.insert(orders)
        .values({
          id,
          userId,
          recipient,
          email,
          phone,
          line,
          city,
          postal,
          subtotal: quote.subtotal,
          shipping: quote.shipping,
          total: quote.total,
          currency: quote.currency,
          idempotencyKey: input.idempotencyKey,
          fingerprint,
          guestHash: digest(token),
          createdAt: Date.now(),
        })
        .run();
      for (const item of quote.items) {
        const updated = db
          .update(variants)
          .set({ stock: sql`${variants.stock} - ${item.quantity}` })
          .where(
            and(
              eq(variants.sku, item.sku),
              sql`${variants.stock} >= ${item.quantity}`,
            ),
          )
          .returning()
          .all();
        if (updated.length !== 1)
          throw new StoreError(
            "Stock changed. Please review your bag and try again.",
            409,
          );
        db.insert(orderItems)
          .values({
            id: randomUUID(),
            orderId: id,
            sku: item.sku,
            productName: item.name,
            image: item.image,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unitPrice: item.price,
          })
          .run();
      }
      db.insert(orderEvents)
        .values({
          id: randomUUID(),
          orderId: id,
          status: "placed",
          createdAt: Date.now(),
        })
        .run();
      return { id, access: token, duplicate: false };
    })
    .immediate();
}
export function canReadOrder(
  order: typeof orders.$inferSelect,
  userId: string | null,
  token?: string,
) {
  if (userId && order.userId === userId) return true;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  return timingSafeEqual(
    Buffer.from(order.guestHash, "hex"),
    Buffer.from(digest(token), "hex"),
  );
}
export function getOrder(
  id: string,
  userId: string | null,
  token?: string,
  admin = false,
) {
  const order = db.select().from(orders).where(eq(orders.id, id)).get();
  if (!order || (!admin && !canReadOrder(order, userId, token)))
    throw new StoreError("Order not found or access denied.", 404);
  const {
    guestHash: _hash,
    fingerprint: _fingerprint,
    idempotencyKey: _key,
    ...safe
  } = order;
  void _hash;
  void _fingerprint;
  void _key;
  return {
    ...safe,
    items: db.select().from(orderItems).where(eq(orderItems.orderId, id)).all(),
    events: db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, id))
      .orderBy(orderEvents.createdAt)
      .all(),
  };
}
export const transitions: Record<string, string[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
export function updateOrderStatus(id: string, next: string) {
  return sqlite
    .transaction(() => {
      const order = db.select().from(orders).where(eq(orders.id, id)).get();
      if (!order) throw new StoreError("Order not found.", 404);
      if (order.status === next) return;
      if (!transitions[order.status]?.includes(next))
        throw new StoreError(
          `Cannot move an order from ${order.status} to ${next}.`,
          409,
        );
      if (next === "cancelled" && !order.stockRestored) {
        const items = db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, id))
          .all();
        for (const item of items)
          db.update(variants)
            .set({ stock: sql`${variants.stock} + ${item.quantity}` })
            .where(eq(variants.sku, item.sku))
            .run();
      }
      db.update(orders)
        .set({
          status: next,
          stockRestored: next === "cancelled" || order.stockRestored,
        })
        .where(eq(orders.id, id))
        .run();
      db.insert(orderEvents)
        .values({
          id: randomUUID(),
          orderId: id,
          status: next,
          createdAt: Date.now(),
        })
        .run();
    })
    .immediate();
}
export function authorizeAdmin(actor: { role: string } | null) {
  if (!actor) throw new StoreError("Sign in to continue.", 401);
  if (actor.role !== "admin")
    throw new StoreError("Administrator access required.", 403);
}
export function adminMetrics() {
  const rows = db.select().from(orders).all();
  return {
    orders: rows.length,
    booked: rows
      .filter((x) => x.status !== "cancelled")
      .reduce((sum, x) => sum + x.total, 0),
    delivered: rows.filter((x) => x.status === "delivered").length,
    customers: db
      .select()
      .from(user)
      .all()
      .filter((x) => x.role === "customer").length,
    inventory: db
      .select()
      .from(variants)
      .all()
      .reduce((sum, x) => sum + x.stock, 0),
  };
}
export function customerOrders(userId: string) {
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .all();
}
