"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ArrowUpRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { money, dateTime } from "@/lib/format";
import type { addresses } from "@/server/schema";
import type { getOrder } from "@/server/store";
type Address = typeof addresses.$inferSelect;
type Data = {
  user: { name: string; email: string; role: string };
  addresses: Address[];
  orders: ReturnType<typeof getOrder>[];
};
export function AccountPanel({
  initial,
  timezone,
}: {
  initial: Data;
  timezone: string;
}) {
  const [data, setData] = useState(initial);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Address | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function refresh() {
    setData(await api<Data>("account"));
  }
  async function action(callback: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await callback();
      await refresh();
      setMessage("Your changes have been saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR SOLEVA ACCOUNT</span>
          <h1>Hello, {data.user.name.split(" ")[0]}.</h1>
          <p>{data.user.email}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          {data.user.role === "admin" && (
            <Link className="btn btn-dark" href="/admin">
              Administration ↗
            </Link>
          )}
          <button
            className="btn btn-outline"
            onClick={async () => {
              await authClient.signOut();
              router.push("/");
              router.refresh();
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <div className="account-layout">
        <section>
          <h2>Your moves so far.</h2>
          {data.orders.length ? (
            <div className="account-orders">
              {data.orders.map((order) => (
                <Link
                  href={`/orders/${order.id}`}
                  className="account-order"
                  key={order.id}
                >
                  <div>
                    <strong>Order {order.id.slice(0, 8).toUpperCase()}</strong>
                    <p>{dateTime(order.createdAt, timezone)}</p>
                  </div>
                  <span className="status-tag">{order.status}</span>
                  <strong>{money(order.total, order.currency)}</strong>
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state compact">
              <p>No orders yet. Your next move is waiting.</p>
              <Link className="text-btn" href="/shop">
                Explore the collection ↗
              </Link>
            </div>
          )}
          <h2>Saved addresses</h2>
          <div className="address-list">
            {data.addresses.map((address) => (
              <div key={address.id} className="address-card">
                <h3>{address.label}</h3>
                <p>
                  {address.recipient}
                  <br />
                  {address.line}
                  <br />
                  {address.city}, {address.postal}
                  <br />
                  {address.phone}
                </p>
                <div className="flex gap-5">
                  <button
                    className="text-btn"
                    onClick={() => setEditing(address)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-btn"
                    disabled={busy}
                    onClick={() =>
                      action(() =>
                        api(`addresses/${address.id}`, undefined, "DELETE"),
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <h3>{editing ? "Edit address" : "Add an address"}</h3>
          <form
            key={editing?.id || "new"}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const values = Object.fromEntries(new FormData(e.currentTarget));
              await action(() =>
                api("addresses", { ...values, id: editing?.id }),
              );
              setEditing(null);
            }}
          >
            {(
              [
                ["label", "Address label"],
                ["recipient", "Recipient"],
                ["phone", "Phone"],
                ["city", "City"],
                ["line", "Street address"],
                ["postal", "Postal code"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className={key === "line" ? "sm:col-span-2" : ""}
              >
                {label}
                <input
                  name={key}
                  required
                  defaultValue={editing?.[key]}
                  minLength={key === "line" ? 8 : key === "phone" ? 7 : 2}
                  maxLength={key === "line" ? 250 : 100}
                />
              </label>
            ))}
            <button className="btn btn-dark" disabled={busy}>
              {busy ? "Saving…" : "Save address"}
            </button>
            {editing && (
              <button
                type="button"
                className="text-btn"
                onClick={() => setEditing(null)}
              >
                Cancel editing
              </button>
            )}
          </form>
        </section>
        <aside>
          <div className="account-profile">
            <h2>Profile</h2>
            <form
              className="stack-form"
              onSubmit={(e) => {
                e.preventDefault();
                const name = new FormData(e.currentTarget).get("name");
                void action(() => api("profile", { name }, "PUT"));
              }}
            >
              <label>
                Display name
                <input
                  name="name"
                  defaultValue={data.user.name}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </label>
              <button className="btn btn-outline" disabled={busy}>
                Update profile
              </button>
            </form>
            <p className="small muted">
              Your email is your account identifier. Passwords are hashed by
              Better Auth and sessions use secure cookies.
            </p>
            <Link href="/wishlist" className="text-btn">
              Your saved designs ↗
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
