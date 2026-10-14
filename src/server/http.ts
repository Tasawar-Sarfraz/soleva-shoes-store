import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { StoreError } from "./store";
const buckets = new Map<string, { count: number; expires: number }>();
export function checkWriteRequest(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (origin !== new URL(allowed).origin)
    throw new StoreError("Invalid request origin.", 403);
  const key =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  if (buckets.size > 2000)
    for (const [key, value] of buckets)
      if (value.expires < now) buckets.delete(key);
  const bucket = buckets.get(key);
  if (!bucket || bucket.expires < now)
    buckets.set(key, { count: 1, expires: now + 60000 });
  else if (++bucket.count > 120)
    throw new StoreError("Too many requests. Please wait a minute.", 429);
}
export function errorResponse(error: unknown) {
  if (error instanceof SyntaxError)
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 },
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: error.issues
          .map((x) => `${x.path.join(".")}: ${x.message}`)
          .join("; "),
      },
      { status: 400 },
    );
  if (error instanceof StoreError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof Error && error.message.includes("UNIQUE constraint"))
    return NextResponse.json(
      { error: "That slug or SKU already exists. Choose a unique value." },
      { status: 409 },
    );
  console.error(
    "Server operation failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  return NextResponse.json(
    { error: "The operation could not be completed. Please try again." },
    { status: 500 },
  );
}
