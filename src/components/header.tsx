"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Heart,
  UserRound,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { useShopping } from "@/lib/client-store";
import { authClient } from "@/lib/auth-client";
const subscribe = () => () => {};
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
export function Header({ shippingThreshold }: { shippingThreshold: string }) {
  const path = usePathname();
  const [mobile, setMobile] = useState(false);
  const cart = useShopping((s) => s.cart);
  const ready = useHydrated();
  const { data } = authClient.useSession();
  const count = cart.reduce((sum, x) => sum + x.quantity, 0);
  const links = [
    ["Collection", "/shop"],
    ["The atelier", "/atelier"],
    ["Visit us", "/stores"],
  ];
  return (
    <>
      <div className="announcement">
        BUILT FOR YOUR NEXT MOVE.{" "}
        <span>Complimentary demo delivery from {shippingThreshold}</span>
        <ArrowUpRight size={12} />
      </div>
      <header className="site-header">
        <Link href="/" className="wordmark" aria-label="SOLEVA home">
          SOLEVA<span>®</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([name, href]) => (
            <Link
              className={path.startsWith(href) ? "active" : ""}
              key={href}
              href={href}
            >
              {name}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link href="/wishlist" aria-label="Wishlist">
            <Heart size={20} />
          </Link>
          <Link href={data ? "/account" : "/login"} aria-label="Your account">
            <UserRound size={20} />
          </Link>
          <Link
            className="bag-link"
            href="/cart"
            aria-label={`Shopping bag${ready ? `, ${count} items` : ""}`}
          >
            <ShoppingBag size={20} />
            <span>{ready ? count : 0}</span>
          </Link>
          <button
            className="mobile-toggle icon-btn"
            aria-label={mobile ? "Close navigation" : "Open navigation"}
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {mobile && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {links.map(([name, href]) => (
            <Link key={href} href={href} onClick={() => setMobile(false)}>
              {name}
              <ArrowUpRight size={18} />
            </Link>
          ))}
          <Link href="/contact" onClick={() => setMobile(false)}>
            Contact the atelier
          </Link>
        </nav>
      )}
    </>
  );
}
