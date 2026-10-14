import Link from "next/link";
export default function NotFound() {
  return (
    <div className="section empty-state">
      <span className="eyebrow">404 / OUT OF FRAME</span>
      <h1>This path takes a different turn.</h1>
      <p>The page or product could not be found.</p>
      <Link href="/shop" className="btn btn-dark">
        Explore the collection
      </Link>
    </div>
  );
}
