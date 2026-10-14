import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { sqlite } from "../src/server/db";
export function migrate() {
  sqlite.exec(
    "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)",
  );
  for (const name of readdirSync("migrations")
    .filter((x) => x.endsWith(".sql"))
    .sort()) {
    if (sqlite.prepare("SELECT name FROM _migrations WHERE name = ?").get(name))
      continue;
    sqlite
      .transaction(() => {
        sqlite.exec(readFileSync(join("migrations", name), "utf8"));
        sqlite
          .prepare("INSERT INTO _migrations VALUES (?, ?)")
          .run(name, Date.now());
      })
      .immediate();
    console.log(`Applied ${name}`);
  }
}
migrate();
