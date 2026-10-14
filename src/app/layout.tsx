import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import { getSettings } from "@/server/store";
import { money } from "@/lib/format";
import "./globals.css";
const dm = localFont({
  src: "../../public/fonts/dm-sans.woff2",
  variable: "--font-dm",
  display: "swap",
});
const serif = localFont({
  src: "../../public/fonts/dm-serif-display-italic.woff2",
  variable: "--font-serif",
  display: "swap",
  style: "italic",
  weight: "400",
});
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  icons: { icon: "/favicon.svg" },
  title: {
    default: "SOLEVA — Built for your next move.",
    template: "%s | SOLEVA",
  },
  description:
    "The Motion Atelier. Explore an original demonstration footwear collection, thoughtful construction and a considered shopping experience.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = getSettings();
  return (
    <html lang={config.language.split("-")[0]} data-scroll-behavior="smooth">
      <body className={`${dm.variable} ${serif.variable}`}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header
          shippingThreshold={money(
            config.freeShipping,
            config.currency,
            config.language,
          )}
        />
        <main id="main">{children}</main>
        <footer className="footer">
          <div className="footer-main">
            <div>
              <Link href="/" className="wordmark">
                SOLEVA<span>®</span>
              </Link>
              <p>
                Built for your next move.
                <br />
                Considered form. Everyday possibility.
              </p>
            </div>
            <div>
              <h3>Explore</h3>
              <Link href="/shop">The collection</Link>
              <Link href="/atelier">Design atelier</Link>
              <Link href="/stores">Demonstration showrooms</Link>
            </div>
            <div>
              <h3>Here to help</h3>
              <Link href="/information">Delivery & returns</Link>
              <Link href="/contact">
                Contact us <ArrowUpRight size={12} />
              </Link>
              <Link href="/account">Your account</Link>
            </div>
            <div className="footer-note">
              <span className="eyebrow">AN ORIGINAL DEMONSTRATION</span>
              <p>
                100 fictional products. Local artwork.
                <br />
                Orders are saved locally; no real payment
                <br />
                or fulfilment takes place.
              </p>
              <Link href="/atelier">Meet the Motion Atelier ↗</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} SOLEVA. Original demonstration brand.
            </span>
            <span>
              {config.currency} / {config.language} / {config.timezone}
            </span>
          </div>
        </footer>
        <Providers />
      </body>
    </html>
  );
}
