import { getSettings } from "@/server/store";
import { money } from "@/lib/format";
import Link from "next/link";
export const metadata = { title: "Delivery & returns" };
export default function Information() {
  const config = getSettings();
  return (
    <div className="section information-page">
      <span className="eyebrow">THE PRACTICAL DETAILS</span>
      <h1>Delivery & returns.</h1>
      <section>
        <h2>Delivery</h2>
        <p>{config.delivery}</p>
        <p>
          Shipping is {money(config.shippingFee, config.currency)} for orders
          below {money(config.freeShipping, config.currency)}. At or above that
          amount, delivery is complimentary. The server calculates the shipping
          amount.
        </p>
      </section>
      <section>
        <h2>Returns</h2>
        <p>{config.returns}</p>
      </section>
      <section>
        <h2>Demonstration privacy</h2>
        <p>
          This downloadable application stores accounts, hashed passwords,
          sessions, addresses, enquiries and orders in its local SQLite
          database. Guest bags and viewer preferences are kept in browser
          storage. No analytics or advertising trackers are installed.
        </p>
        <p>
          Guest order URLs contain an access token. Keep them private.
          Administrators can see order and enquiry records. A production
          operator must provide its own privacy policy, retention rules,
          backups, verified contact details and legal terms.
        </p>
      </section>
      <Link href="/contact" className="btn btn-dark">
        Contact the atelier ↗
      </Link>
    </div>
  );
}
