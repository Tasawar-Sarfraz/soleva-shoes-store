import { Checkout } from "@/components/checkout";
export const metadata = { title: "Checkout" };
export default function CheckoutPage() {
  return (
    <div className="section">
      <div className="page-heading">
        <span className="eyebrow">ONE LAST STEP</span>
        <h1>Your next move.</h1>
        <p>Simple checkout. Cash on delivery. No payment key required.</p>
      </div>
      <Checkout />
    </div>
  );
}
