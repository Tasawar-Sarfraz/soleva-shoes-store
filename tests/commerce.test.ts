import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { eq } from "drizzle-orm";
import { sampleCatalogue } from "../src/lib/catalogue";
import { shoeArtwork } from "../src/lib/artwork";
import { filterProducts } from "../src/lib/filter";
import { monogramTransform } from "../src/lib/design-math";
import { money } from "../src/lib/format";
import { shoeDesignIndex } from "../src/lib/shoe-design";
import { variants, products, user, orders } from "../src/server/schema";
let database: typeof import("../src/server/db");
let store: typeof import("../src/server/store");
let seed: typeof import("../scripts/seed");
const folder = mkdtempSync(join(tmpdir(), "soleva-tests-"));
const sku = "sneakers-01-40-0";
function checkout(items = [{ sku, quantity: 1 }]) {
  return {
    recipient: "Test Customer",
    email: "test@soleva.example",
    phone: "+92 300 1234567",
    line: "42 Test Avenue",
    city: "Karachi",
    postal: "75500",
    items,
    idempotencyKey: randomUUID(),
  };
}
beforeAll(async () => {
  process.env.DATABASE_PATH = join(folder, "test.sqlite");
  process.env.BETTER_AUTH_SECRET = randomBytes(48).toString("hex");
  process.env.SEED_DEMO_ACCOUNTS = "false";
  database = await import("../src/server/db");
  await import("../scripts/migrate");
  seed = await import("../scripts/seed");
  store = await import("../src/server/store");
  for (const id of ["owner", "other"])
    database.db
      .insert(user)
      .values({
        id,
        email: `${id}@soleva.example`,
        name: id,
        role: "customer",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();
});
beforeEach(() => {
  database.sqlite.exec(
    "DELETE FROM order_events; DELETE FROM order_items; DELETE FROM orders;",
  );
  database.db
    .update(variants)
    .set({ stock: 7 })
    .where(eq(variants.sku, sku))
    .run();
  database.db
    .update(products)
    .set({ price: 1180000, active: true })
    .where(eq(products.id, "sneakers-01"))
    .run();
});
afterAll(() => {
  database.sqlite.close();
  rmSync(folder, { recursive: true, force: true });
});
describe("catalogue and genuine variants", () => {
  it("contains exactly 100 distinct products in the requested category counts", () => {
    const catalogue = sampleCatalogue();
    expect(catalogue).toHaveLength(100);
    expect(new Set(catalogue.map((x) => x.slug)).size).toBe(100);
    expect(
      Object.fromEntries(
        ["Sneakers", "Running", "Casual", "Formal", "Boots"].map((c) => [
          c,
          catalogue.filter((x) => x.category === c).length,
        ]),
      ),
    ).toEqual({ Sneakers: 30, Running: 25, Casual: 20, Formal: 15, Boots: 10 });
    expect(
      catalogue.every(
        (p) =>
          new Set(p.variants.map((v) => v.color)).size === 6 &&
          Number.isInteger(p.price),
      ),
    ).toBe(true);
    for (const category of ["Sneakers", "Running", "Casual", "Formal", "Boots"]) {
      const designs = catalogue.filter((product) => product.category === category);
      expect(new Set(designs.map((product) => product.accent)).size).toBeGreaterThan(1);
      expect(new Set(designs.slice(0, 6).map((product) => shoeDesignIndex(product.id)))).toEqual(
        new Set([0, 1, 2, 3, 4, 5]),
      );
    }
    expect(shoeArtwork("Formal", "#664839", false, 0)).not.toBe(
      shoeArtwork("Formal", "#664839", false, 1),
    );
  });
  it("filters size and colour against the same genuine SKU", () => {
    const catalogue = sampleCatalogue();
    const filtered = filterProducts(catalogue, {
      category: "Sneakers",
      color: "Chalk",
      size: "39",
      availability: "available",
      sort: "price-desc",
    });
    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every((p) =>
        p.variants.some(
          (v) => v.size === 39 && v.color === "Chalk" && v.stock > 0,
        ),
      ),
    ).toBe(true);
    expect(filtered[0].price).toBeGreaterThanOrEqual(filtered.at(-1)!.price);
    expect(filterProducts(catalogue, { q: "nonexistent-name" })).toHaveLength(
      0,
    );
  });
  it("rejects sold-out variants and unknown SKU values", () => {
    expect(() =>
      store.quoteCart([{ sku: "sneakers-30-40-0", quantity: 1 }]),
    ).toThrow("only 0");
    expect(() => store.quoteCart([{ sku: "fake-sku", quantity: 1 }])).toThrow(
      "no longer available",
    );
  });
  it("rejects zero, fractional, excessive and duplicate combined quantities", () => {
    for (const quantity of [0, -1, 1.5, 11])
      expect(() => store.quoteCart([{ sku, quantity }])).toThrow();
    expect(() =>
      store.quoteCart([
        { sku, quantity: 6 },
        { sku, quantity: 6 },
      ]),
    ).toThrow("Maximum 10");
    expect(() => store.quoteCart([{ sku, quantity: 8 }])).toThrow("only 7");
  });
  it("does not accept hidden products", () => {
    database.db
      .update(products)
      .set({ active: false })
      .where(eq(products.id, "sneakers-01"))
      .run();
    expect(() => store.quoteCart([{ sku, quantity: 1 }])).toThrow(
      "no longer available",
    );
  });
});
describe("authoritative calculations and persistent checkout", () => {
  it("displays fractional minor-unit prices accurately", () => {
    expect(money(1250)).toContain("12.50");
    expect(money(1200000)).toContain("12,000");
  });
  it("charges PKR 350 below the free-shipping threshold", () => {
    const quote = store.quoteCart([{ sku, quantity: 1 }]);
    expect(quote.subtotal).toBe(1180000);
    expect(quote.shipping).toBe(35000);
    expect(quote.total).toBe(1215000);
  });
  it("gives free shipping at and above PKR 15000", () => {
    database.db
      .update(products)
      .set({ price: 1500000 })
      .where(eq(products.id, "sneakers-01"))
      .run();
    expect(store.quoteCart([{ sku, quantity: 1 }]).shipping).toBe(0);
    expect(store.quoteCart([{ sku, quantity: 2 }]).total).toBe(3000000);
  });
  it("persists the actual price, leaves COD unpaid and ignores client discounts and totals", () => {
    const result = store.createOrder(
      { ...checkout(), price: 1, discount: 999999, total: 0 },
      "owner",
    );
    const order = store.getOrder(result.id, "owner");
    expect(order.total).toBe(1215000);
    expect(order.paymentStatus).toBe("unpaid");
    expect(order.items[0].unitPrice).toBe(1180000);
    expect(
      database.db.select().from(variants).where(eq(variants.sku, sku)).get()!
        .stock,
    ).toBe(6);
    expect(order.events[0].status).toBe("placed");
  });
  it("retries do not duplicate orders or deduct stock twice", () => {
    const input = checkout();
    const first = store.createOrder(input);
    const second = store.createOrder(input);
    expect(second.id).toBe(first.id);
    expect(second.access).toBe(first.access);
    expect(second.duplicate).toBe(true);
    expect(database.db.select().from(orders).all()).toHaveLength(1);
    expect(
      database.db.select().from(variants).where(eq(variants.sku, sku)).get()!
        .stock,
    ).toBe(6);
  });
  it("rejects reuse of an idempotency key with different details or a different owner", () => {
    const input = checkout();
    store.createOrder(input, "owner");
    expect(() =>
      store.createOrder({ ...input, recipient: "Changed Customer" }, "owner"),
    ).toThrow("already used");
    expect(() => store.createOrder(input, "other")).toThrow("already used");
  });
  it("rolls back the whole order when one line is unavailable", () => {
    expect(() =>
      store.createOrder(
        checkout([
          { sku, quantity: 1 },
          { sku: "sneakers-30-40-0", quantity: 1 },
        ]),
      ),
    ).toThrow();
    expect(database.db.select().from(orders).all()).toHaveLength(0);
    expect(
      database.db.select().from(variants).where(eq(variants.sku, sku)).get()!
        .stock,
    ).toBe(7);
  });
  it("allows only one of two concurrent processes to buy the last pair", async () => {
    database.db
      .update(variants)
      .set({ stock: 1 })
      .where(eq(variants.sku, sku))
      .run();
    const run = (input: unknown) =>
      new Promise<{ ok: boolean }>((resolve, reject) => {
        const process = spawn(
          globalThis.process.execPath,
          ["--import", "tsx", "scripts/checkout-worker.ts"],
          { env: globalThis.process.env },
        );
        let out = "";
        let error = "";
        process.stdout.on("data", (chunk) => (out += chunk));
        process.stderr.on("data", (chunk) => (error += chunk));
        process.on("error", reject);
        process.on("close", (code) => {
          if (code !== 0) return reject(new Error(error));
          try {
            resolve(JSON.parse(out));
          } catch (e) {
            reject(e);
          }
        });
        process.stdin.end(JSON.stringify(input));
      });
    const results = await Promise.all([run(checkout()), run(checkout())]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(database.db.select().from(orders).all()).toHaveLength(1);
    expect(
      database.db.select().from(variants).where(eq(variants.sku, sku)).get()!
        .stock,
    ).toBe(0);
  }, 20000);
});
describe("ownership, cancellation and administration", () => {
  it("protects customer orders and accepts the secure guest key", () => {
    const result = store.createOrder(checkout(), "owner");
    expect(() => store.getOrder(result.id, "other")).toThrow("access denied");
    expect(() => store.getOrder(result.id, null, "0".repeat(64))).toThrow(
      "access denied",
    );
    expect(store.getOrder(result.id, "owner").id).toBe(result.id);
    expect(store.getOrder(result.id, null, result.access).id).toBe(result.id);
    expect(store.getOrder(result.id, "owner")).not.toHaveProperty("guestHash");
  });
  it("restores stock on cancellation exactly once", () => {
    const result = store.createOrder(checkout());
    store.updateOrderStatus(result.id, "cancelled");
    store.updateOrderStatus(result.id, "cancelled");
    expect(
      database.db.select().from(variants).where(eq(variants.sku, sku)).get()!
        .stock,
    ).toBe(7);
    const order = store.getOrder(result.id, null, result.access);
    expect(order.stockRestored).toBe(true);
    expect(order.events.filter((x) => x.status === "cancelled")).toHaveLength(
      1,
    );
    expect(() => store.updateOrderStatus(result.id, "confirmed")).toThrow(
      "Cannot move",
    );
  });
  it("enforces permitted status transitions and prevents cancelling shipped orders", () => {
    const result = store.createOrder(checkout());
    expect(() => store.updateOrderStatus(result.id, "delivered")).toThrow(
      "Cannot move",
    );
    store.updateOrderStatus(result.id, "confirmed");
    store.updateOrderStatus(result.id, "shipped");
    expect(() => store.updateOrderStatus(result.id, "cancelled")).toThrow(
      "Cannot move",
    );
    store.updateOrderStatus(result.id, "delivered");
    expect(store.getOrder(result.id, null, result.access).status).toBe(
      "delivered",
    );
  });
  it("rejects visitors and customer accounts from administrator operations", () => {
    expect(() => store.authorizeAdmin(null)).toThrow("Sign in");
    expect(() => store.authorizeAdmin({ role: "customer" })).toThrow(
      "Administrator",
    );
    expect(() => store.authorizeAdmin({ role: "admin" })).not.toThrow();
  });
  it("repeat seeding preserves inventory and existing order data", () => {
    const result = store.createOrder(checkout());
    seed.seedCatalogue();
    expect(database.db.select().from(products).all()).toHaveLength(100);
    expect(
      database.db.select().from(variants).where(eq(variants.sku, sku)).get()!
        .stock,
    ).toBe(6);
    expect(
      database.db
        .select()
        .from(variants)
        .where(eq(variants.sku, "sneakers-01-40-5"))
        .get()!.color,
    ).toBe("Butter");
    expect(store.getOrder(result.id, null, result.access).id).toBe(result.id);
  });
});
describe("design lab transformations", () => {
  it("calculates a finite monogram transform and rejects invalid inputs", () => {
    const result = monogramTransform(0.5, 30, 1.2);
    expect(result.position[0]).toBeCloseTo(0.2);
    expect(result.rotation).toBeCloseTo(Math.PI / 6);
    expect(result.matrix).toHaveLength(16);
    expect(result.matrix.every(Number.isFinite)).toBe(true);
    expect(result.matrix[12]).toBeCloseTo(0.2);
    expect(() => monogramTransform(NaN, 0, 1)).toThrow();
    expect(() => monogramTransform(2, 0, 1)).toThrow();
    expect(() => monogramTransform(0, 0, 0)).toThrow();
  });
});
