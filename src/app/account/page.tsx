import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { currentUser } from "@/server/auth";
import { db } from "@/server/db";
import { addresses } from "@/server/schema";
import { customerOrders, getOrder, getSettings } from "@/server/store";
import { AccountPanel } from "@/components/account-panel";
export const metadata = { title: "Your account", robots: { index: false } };
export default async function AccountPage() {
  const actor = await currentUser();
  if (!actor) redirect("/login?next=/account");
  const initial = {
    user: { name: actor.name, email: actor.email, role: actor.role },
    addresses: db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, actor.id))
      .all(),
    orders: customerOrders(actor.id).map((x) => getOrder(x.id, actor.id)),
  };
  return (
    <div className="section">
      <AccountPanel initial={initial} timezone={getSettings().timezone} />
    </div>
  );
}
