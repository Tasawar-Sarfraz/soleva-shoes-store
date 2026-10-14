import { Cart } from "@/components/cart";
import { getProducts } from "@/server/store";
export const metadata = { title: "Your bag" };
export default function CartPage() {
  return (
    <div className="section">
      <div className="page-heading">
        <span className="eyebrow">A CONSIDERED SELECTION</span>
        <h1>Your bag.</h1>
        <p>A few good things, ready for your next move.</p>
      </div>
      <Cart products={getProducts(true)} />
    </div>
  );
}
