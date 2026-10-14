import { createOrder, StoreError } from "../src/server/store";
let input = "";
for await (const chunk of process.stdin) input += chunk;
try {
  const result = createOrder(JSON.parse(input));
  console.log(JSON.stringify({ ok: true, ...result }));
} catch (error) {
  console.log(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown failure",
      status: error instanceof StoreError ? error.status : 500,
    }),
  );
}
