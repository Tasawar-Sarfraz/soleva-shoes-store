import { getProducts, getSettings } from "@/server/store";
import { Wishlist } from "@/components/wishlist";
export const metadata = { title: "Saved designs" };
export default function WishlistPage() {
  return (
    <div className="section">
      <div className="page-heading">
        <span className="eyebrow">FOR A FUTURE MOVE</span>
        <h1>Saved designs.</h1>
        <p>A collection of possibilities, kept close.</p>
      </div>
      <Wishlist products={getProducts()} currency={getSettings().currency} />
    </div>
  );
}
