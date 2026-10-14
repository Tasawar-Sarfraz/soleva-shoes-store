import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { parse } from "dotenv";
if (!existsSync(".env")) {
  const template = readFileSync(".env.example", "utf8");
  writeFileSync(
    ".env",
    template.replace(
      "BETTER_AUTH_SECRET=",
      `BETTER_AUTH_SECRET=${randomBytes(48).toString("base64url")}`,
    ),
    { mode: 0o600, flag: "wx" },
  );
  console.log(
    "Created .env with a fresh development secret. Existing configuration is never overwritten.",
  );
}
const content = readFileSync(".env", "utf8");
const config = parse(content);
if (!config.BETTER_AUTH_SECRET && !process.env.BETTER_AUTH_SECRET) {
  const generated = randomBytes(48).toString("base64url");
  const empty = /^BETTER_AUTH_SECRET\s*=\s*(?:""|'')?\s*$/m;
  writeFileSync(
    ".env",
    empty.test(content)
      ? content.replace(empty, `BETTER_AUTH_SECRET=${generated}`)
      : `${content}\nBETTER_AUTH_SECRET=${generated}\n`,
    { mode: 0o600 },
  );
  console.log(
    "Filled the empty development-secret slot; existing configuration values were preserved.",
  );
} else if (
  (process.env.BETTER_AUTH_SECRET || config.BETTER_AUTH_SECRET).length < 32
) {
  throw new Error(
    "BETTER_AUTH_SECRET must contain at least 32 random characters. Your existing value was preserved.",
  );
}
mkdirSync("data", { recursive: true });
for (const file of [
  "scripts/assets.ts",
  "scripts/migrate.ts",
  "scripts/seed.ts",
]) {
  execFileSync(process.execPath, ["--import", "tsx", file], {
    stdio: "inherit",
  });
}
console.log("SOLEVA setup complete. Run npm run dev.");
