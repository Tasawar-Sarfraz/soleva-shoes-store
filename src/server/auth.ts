import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "./db";
import * as schema from "./schema";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32)
  throw new Error(
    "A secure BETTER_AUTH_SECRET is required. Run npm run setup before starting the app.",
  );
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  secret,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "customer", input: false },
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 7, cookieCache: { enabled: false } },
  rateLimit: { enabled: true, window: 60, max: 50 },
});

export async function currentUser() {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result) return null;
  return (
    db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, result.user.id))
      .get() ?? null
  );
}
