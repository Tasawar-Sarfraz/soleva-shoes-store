import "dotenv/config";
import { eq } from "drizzle-orm";
import { sampleCatalogue, defaultSettings } from "../src/lib/catalogue";
import { db, sqlite } from "../src/server/db";
import { products, variants, settings, user } from "../src/server/schema";
import { auth } from "../src/server/auth";
export function seedCatalogue() {
  sqlite
    .transaction(() => {
      for (const product of sampleCatalogue()) {
        const { variants: skus, ...row } = product;
        db.insert(products).values(row).onConflictDoNothing().run();
        for (const sku of skus)
          db.insert(variants).values(sku).onConflictDoNothing().run();
      }
      for (const [key, value] of Object.entries(defaultSettings))
        db.insert(settings)
          .values({ key, value: JSON.stringify(value) })
          .onConflictDoNothing()
          .run();
    })
    .immediate();
}
seedCatalogue();
if (process.env.SEED_DEMO_ACCOUNTS === "true") {
  for (const [email, name, role] of [
    ["admin@soleva.example", "Atelier Administrator", "admin"],
    ["customer@soleva.example", "Demo Customer", "customer"],
  ]) {
    if (db.select().from(user).where(eq(user.email, email)).get()) continue;
    const result = await auth.api.signUpEmail({
      body: { email, name, password: "MoveWithSoleva!24" },
    });
    db.update(user).set({ role }).where(eq(user.id, result.user.id)).run();
  }
  console.log(
    "Local demonstration accounts ready (see README). Disable SEED_DEMO_ACCOUNTS for real deployments.",
  );
}
console.log(
  `Catalogue has ${db.select().from(products).all().length} products. Existing customers, orders, stock, and settings were preserved.`,
);
