"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useCartQuote, OrderSummary } from "./cart";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useShopping } from "@/lib/client-store";
import { checkoutSchema } from "@/lib/validation";
type Address = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  line: string;
  city: string;
  postal: string;
};
export function Checkout() {
  const { cart, quote, error, loading, ready } = useCartQuote();
  const router = useRouter();
  const { data } = authClient.useSession();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const attempt = useRef<string>("");
  const [addressList, setAddressList] = useState<Address[]>([]);
  const [selected, setSelected] = useState("");
  useEffect(() => {
    if (!data?.user.id) return;
    let active = true;
    api<{ addresses: Address[] }>("account")
      .then((result) => {
        if (active) setAddressList(result.addresses);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [data?.user.id]);
  const address = addressList.find((x) => x.id === selected);
  if (!ready) return <p role="status">Loading checkout…</p>;
  if (!cart.length)
    return (
      <div className="empty-state">
        <h2>Your bag is empty.</h2>
        <Link href="/shop" className="btn btn-dark">
          Explore the collection
        </Link>
      </div>
    );
  return (
    <div className="checkout-layout">
      <form
        className="checkout-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setProblem("");
          const fields = Object.fromEntries(new FormData(event.currentTarget));
          if (!attempt.current) attempt.current = crypto.randomUUID();
          const result = checkoutSchema.safeParse({
            ...fields,
            items: cart,
            idempotencyKey: attempt.current,
          });
          if (!result.success) {
            setProblem(result.error.issues.map((x) => x.message).join(" "));
            return;
          }
          setBusy(true);
          try {
            const content = JSON.stringify({
              ...fields,
              items: cart,
              actor: data?.user.id || "guest",
            });
            const bytes = await crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(content),
            );
            const signature = Array.from(new Uint8Array(bytes), (x) =>
              x.toString(16).padStart(2, "0"),
            ).join("");
            try {
              const saved = JSON.parse(
                sessionStorage.getItem("soleva-checkout-attempt") || "null",
              ) as { key: string; signature: string } | null;
              if (saved?.signature === signature)
                result.data.idempotencyKey = saved.key;
              sessionStorage.setItem(
                "soleva-checkout-attempt",
                JSON.stringify({ key: result.data.idempotencyKey, signature }),
              );
            } catch {
              /* In-memory idempotency remains available when storage is restricted. */
            }
            const order = await api<{ id: string; access: string }>(
              "checkout",
              result.data,
            );
            useShopping.getState().clear();
            try {
              sessionStorage.removeItem("soleva-checkout-attempt");
            } catch {
              /* No storage permission needed to place an order. */
            }
            router.push(`/orders/${order.id}?access=${order.access}`);
          } catch (e) {
            setProblem((e as Error).message);
            setBusy(false);
          }
        }}
      >
        <div className="checkout-step">
          <span>01</span>
          <div>
            <h2>Contact & delivery</h2>
            <p>
              {data ? (
                `Ordering as ${data.user.email}`
              ) : (
                <>
                  Already have an account?{" "}
                  <Link href="/login?next=/checkout">Sign in</Link> to save this
                  order to your history.
                </>
              )}
            </p>
          </div>
        </div>
        {addressList.length > 0 && (
          <label>
            Use a saved address
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Enter a new address</option>
              {addressList.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label} — {x.city}
                </option>
              ))}
            </select>
          </label>
        )}
        <div key={selected} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <label>
            Full name
            <input
              name="recipient"
              autoComplete="shipping name"
              required
              minLength={2}
              maxLength={100}
              defaultValue={address?.recipient || data?.user.name}
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={200}
              defaultValue={data?.user.email}
            />
          </label>
          <label>
            Phone number
            <input
              name="phone"
              type="tel"
              autoComplete="shipping tel"
              required
              placeholder="+92 300 1234567"
              defaultValue={address?.phone}
            />
          </label>
          <label>
            City
            <input
              name="city"
              autoComplete="shipping address-level2"
              required
              minLength={2}
              maxLength={100}
              defaultValue={address?.city}
            />
          </label>
          <label className="sm:col-span-2">
            Street address
            <input
              name="line"
              autoComplete="shipping street-address"
              required
              minLength={8}
              maxLength={250}
              defaultValue={address?.line}
            />
          </label>
          <label>
            Postal code
            <input
              name="postal"
              autoComplete="shipping postal-code"
              required
              pattern="[a-zA-Z0-9 \-]{3,12}"
              defaultValue={address?.postal}
            />
          </label>
          <label>
            Country
            <input value="Pakistan" disabled aria-label="Country Pakistan" />
          </label>
        </div>
        <div className="checkout-step">
          <span>02</span>
          <div>
            <h2>Payment</h2>
            <p>Cash on delivery</p>
          </div>
        </div>
        <div className="payment-box">
          <ShieldCheck size={21} />
          <div>
            <strong>Pay when your order arrives.</strong>
            <p>
              This is a local demonstration. Your order is saved as unpaid; no
              real payment or fulfilment occurs.
            </p>
          </div>
        </div>
        {(problem || error) && (
          <p role="alert" className="error-box">
            {problem || error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || loading || !quote}
          className="btn btn-dark full-width"
        >
          {busy ? "Saving your order…" : "Place cash-on-delivery order"}{" "}
          <ArrowRight size={18} />
        </button>
        <p className="small muted">
          By placing this demo order you acknowledge the{" "}
          <Link href="/information">delivery and returns information</Link>.
          Your address is stored in the local database.
        </p>
      </form>
      <aside className="order-summary">
        <span className="eyebrow">YOUR SELECTION</span>
        <h2>Order summary</h2>
        {quote?.items.map((item) => (
          <div className="checkout-item" key={item.sku}>
            <div>
              <strong>{item.name}</strong>
              <p>
                EU {item.size} / {item.color} × {item.quantity}
              </p>
            </div>
          </div>
        ))}
        <OrderSummary quote={quote} loading={loading} />
        <Link href="/cart" className="text-btn">
          Edit your bag →
        </Link>
      </aside>
    </div>
  );
}
