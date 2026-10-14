import { redirect } from "next/navigation";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { currentUser } from "@/server/auth";
import { db } from "@/server/db";
import { orders, enquiries } from "@/server/schema";
import {
  getProducts,
  getSettings,
  getOrder,
  adminMetrics,
} from "@/server/store";
import { AdminPanel } from "@/components/admin-panel";
export const metadata = {
  title: "Atelier administration",
  robots: { index: false },
};
export default async function AdminPage() {
  const actor = await currentUser();
  if (!actor) redirect("/login?next=/admin");
  if (actor.role !== "admin")
    return (
      <div className="section empty-state">
        <h1>Administrator access required.</h1>
        <p>Your account does not have access to the atelier dashboard.</p>
        <Link className="btn btn-dark" href="/account">
          Your account
        </Link>
      </div>
    );
  const initial = {
    metrics: adminMetrics(),
    products: getProducts(true),
    orders: db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .all()
      .map((row) => getOrder(row.id, actor.id, undefined, true)),
    enquiries: db
      .select()
      .from(enquiries)
      .orderBy(desc(enquiries.createdAt))
      .all(),
    settings: getSettings(),
  };
  return <AdminPanel initial={initial} />;
}
