"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowUpRight, Minus, Plus, Trash2, ShieldCheck } from "lucide-react";
import { useShopping } from "@/lib/client-store";
import { useHydrated } from "./header";
import { money } from "@/lib/format";
import { api } from "@/lib/api";
import type { Product, Quote } from "@/lib/types";
export function useCartQuote() {
  const cart = useShopping((s) => s.cart);
  const ready = useHydrated();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!ready || !cart.length) return;
    let cancelled = false;
    const fetchQuote = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await api<Quote>("cart/quote", { items: cart });
        if (!cancelled) setQuote(result);
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setQuote(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchQuote();
    window.addEventListener("focus", fetchQuote);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", fetchQuote);
    };
  }, [cart, ready]);
  return { cart, quote: cart.length ? quote : null, error, loading, ready };
}
export function OrderSummary({
  quote,
  loading = false,
}: {
  quote: Quote | null;
  loading?: boolean;
}) {
  return (
    <>
      <div className="summary-lines">
        <div>
          <span>Subtotal</span>
          <strong>{quote ? money(quote.subtotal, quote.currency) : "—"}</strong>
        </div>
        <div>
          <span>Delivery</span>
          <strong>
            {quote
              ? quote.shipping
                ? money(quote.shipping, quote.currency)
                : "Complimentary"
              : "—"}
          </strong>
        </div>
        <div className="summary-total">
          <span>Total</span>
          <strong>{quote ? money(quote.total, quote.currency) : "—"}</strong>
        </div>
      </div>
      {loading && <p role="status">Checking current prices and stock…</p>}
      <p className="small muted">
        Server prices and stock are checked again when you place your order.{" "}
        {quote &&
          `Complimentary delivery from ${money(quote.freeShipping, quote.currency)}.`}
      </p>
    </>
  );
}
export function Cart({ products }: { products: Product[] }) {
  const { cart, quote, error, loading, ready } = useCartQuote();
  const update = useShopping((s) => s.setQuantity);
  const remove = useShopping((s) => s.remove);
  if (!ready)
    return (
      <div className="empty-state" role="status">
        Loading your bag…
      </div>
    );
  if (!cart.length)
    return (
      <div className="empty-state">
        <h2>Your next move starts here.</h2>
        <p>Your shopping bag is empty.</p>
        <Link className="btn btn-dark" href="/shop">
          Explore the collection <ArrowUpRight size={16} />
        </Link>
      </div>
    );
  return (
    <div className="cart-layout">
      <div>
        {cart.map((line) => {
          const product = products.find((p) =>
            p.variants.some((v) => v.sku === line.sku),
          );
          const variant = product?.variants.find((v) => v.sku === line.sku);
          return (
            <article key={line.sku} className="cart-line">
              <div className="cart-image">
                {product && (
                  <Image
                    src={product.image}
                    width={700}
                    height={480}
                    alt={product.name}
                  />
                )}
              </div>
              <div className="cart-line-copy">
                <Link href={product ? `/products/${product.slug}` : "/shop"}>
                  <h3>{product?.name || "Unavailable product"}</h3>
                </Link>
                <p>
                  {variant ? `EU ${variant.size} / ${variant.color}` : line.sku}
                </p>
                <strong>
                  {quote?.items.find((x) => x.sku === line.sku)
                    ? money(
                        quote.items.find((x) => x.sku === line.sku)!.price,
                        quote.currency,
                      )
                    : product
                      ? money(product.price)
                      : "Unavailable"}
                </strong>
                <div className="cart-line-actions">
                  <div className="quantity-control">
                    <button
                      aria-label={`Decrease ${product?.name || line.sku} quantity`}
                      onClick={() => update(line.sku, line.quantity - 1)}
                      disabled={line.quantity === 1}
                    >
                      <Minus size={13} />
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      aria-label={`Increase ${product?.name || line.sku} quantity`}
                      onClick={() => update(line.sku, line.quantity + 1)}
                      disabled={line.quantity >= 10}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <button
                    className="text-btn small"
                    onClick={() => remove(line.sku)}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
              <strong className="line-total">
                {quote?.items.find((x) => x.sku === line.sku) &&
                  money(
                    quote.items.find((x) => x.sku === line.sku)!.price *
                      line.quantity,
                    quote.currency,
                  )}
              </strong>
            </article>
          );
        })}
        <Link className="text-btn" href="/shop">
          ← Keep exploring
        </Link>
      </div>
      <aside className="order-summary">
        <span className="eyebrow">YOUR NEXT MOVE</span>
        <h2>Bag summary</h2>
        {error && (
          <p role="alert" className="error-box">
            {error}
          </p>
        )}
        <OrderSummary quote={quote} loading={loading} />
        <Link
          aria-disabled={!quote || loading}
          tabIndex={!quote || loading ? -1 : 0}
          className={`btn btn-dark full-width ${!quote || loading ? "disabled" : ""}`}
          href="/checkout"
        >
          Continue to checkout <ArrowUpRight size={16} />
        </Link>
        <div className="delivery-note">
          <ShieldCheck size={16} />
          <span>Cash on delivery / No card details needed</span>
        </div>
      </aside>
    </div>
  );
}
