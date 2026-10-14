import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, Package } from "lucide-react";
import { currentUser } from "@/server/auth";
import { getOrder, getSettings } from "@/server/store";
import { money, dateTime } from "@/lib/format";
import { OrderActions } from "@/components/order-actions";
export const metadata = {
  title: "Order receipt",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ access?: string }>;
}) {
  const { id } = await params;
  const { access } = await searchParams;
  const actor = await currentUser();
  let order;
  try {
    order = getOrder(id, actor?.id || null, access);
  } catch {
    notFound();
  }
  const config = getSettings();
  return (
    <div className="section receipt">
      <div className="receipt-check">
        <Check size={30} />
      </div>
      <span className="eyebrow">YOUR MOVE IS IN MOTION</span>
      <h1>Order received.</h1>
      <p>
        Your demonstration order has been saved. Payment is due on delivery.
      </p>
      <p className="muted small">
        Order {order.id.slice(0, 8).toUpperCase()} ·{" "}
        {dateTime(order.createdAt, config.timezone)}
      </p>
      <div className="notice">
        <Package size={18} />
        <strong>{order.status.toUpperCase()}</strong>
        <span>Cash on delivery / {order.paymentStatus}</span>
      </div>
      <div className="receipt-grid">
        <section>
          <h2>Your selection</h2>
          {order.items.map((item) => (
            <div key={item.id} className="receipt-item">
              <div>
                <strong>{item.productName}</strong>
                <p>
                  EU {item.size} / {item.color} × {item.quantity}
                </p>
              </div>
              <strong>
                {money(item.unitPrice * item.quantity, order.currency)}
              </strong>
            </div>
          ))}
          <div className="summary-lines">
            <div>
              <span>Subtotal</span>
              <span>{money(order.subtotal, order.currency)}</span>
            </div>
            <div>
              <span>Delivery</span>
              <span>{money(order.shipping, order.currency)}</span>
            </div>
            <div className="summary-total">
              <strong>Total due</strong>
              <strong>{money(order.total, order.currency)}</strong>
            </div>
          </div>
        </section>
        <section>
          <h2>Delivery details</h2>
          <p>
            {order.recipient}
            <br />
            {order.line}
            <br />
            {order.city}, {order.postal}
            <br />
            {order.phone}
            <br />
            {order.email}
          </p>
          <h3>Status timeline</h3>
          <ol className="timeline">
            {order.events.map((event) => (
              <li key={event.id}>
                <strong>{event.status}</strong>
                <span>{dateTime(event.createdAt, config.timezone)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <div className="flex flex-wrap gap-4">
        <OrderActions />
        <Link className="btn btn-dark print-hidden" href="/shop">
          Keep exploring ↗
        </Link>
      </div>
      <p className="small muted">
        Keep this page URL private: its access key lets this browser view your
        guest order. Signed-in owners can also use their account history.
      </p>
    </div>
  );
}
