"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Box,
  Package,
  MessageSquare,
  Settings,
  Plus,
  ArrowUpRight,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { money, dateTime } from "@/lib/format";
import type { Product, StoreSettings } from "@/lib/types";
import type { getOrder, adminMetrics } from "@/server/store";
import type { enquiries } from "@/server/schema";
type Data = {
  metrics: ReturnType<typeof adminMetrics>;
  products: Product[];
  orders: ReturnType<typeof getOrder>[];
  enquiries: (typeof enquiries.$inferSelect)[];
  settings: StoreSettings;
};
const tabNames = [
  ["overview", "Overview", LayoutDashboard],
  ["products", "Products", Box],
  ["orders", "Orders", Package],
  ["enquiries", "Enquiries", MessageSquare],
  ["settings", "Store settings", Settings],
] as const;
const allowed: Record<string, string[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
const blank: Product = {
  id: "",
  name: "",
  slug: "",
  category: "Sneakers",
  price: 1000000,
  description: "An original demonstration design from the Motion Atelier.",
  materials: "Textile upper and rubber outsole.",
  accent: "#e8e3d4",
  image: "/products/sneakers-generic.svg",
  model: "sneakers",
  active: true,
  createdAt: 0,
  variants: [
    {
      sku: "new-design-40-chalk",
      productId: "",
      size: 40,
      color: "Chalk",
      colorHex: "#e8e3d4",
      stock: 10,
    },
    {
      sku: "new-design-40-graphite",
      productId: "",
      size: 40,
      color: "Graphite",
      colorHex: "#383a35",
      stock: 10,
    },
  ],
};
export function AdminPanel({ initial }: { initial: Data }) {
  const [data, setData] = useState(initial);
  const [tab, setTab] = useState("overview");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  async function perform(callback: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await callback();
      setData(await api<Data>("admin/overview"));
      setMessage("Changes saved to the database.");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const editorDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (editor && editorDialog.current && !editorDialog.current.open)
      editorDialog.current.showModal();
  }, [editor]);
  const filtered = data.products.filter((p) =>
    `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <span className="eyebrow">ATELIER CONTROL</span>
        {tabNames.map(([id, label, Icon]) => (
          <button
            key={id}
            className={tab === id ? "current" : ""}
            onClick={() => {
              setTab(id);
              setMessage("");
              setError("");
            }}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
        <Link href="/shop">
          View storefront <ArrowUpRight size={16} />
        </Link>
        <Link href="/account">Your account</Link>
      </aside>
      <div className="admin-content">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SOLEVA / ADMINISTRATION</span>
            <h1>{tabNames.find((x) => x[0] === tab)?.[1]}</h1>
            <p>Live records from your local database.</p>
          </div>
          {tab === "products" && (
            <button
              className="btn btn-dark"
              onClick={() => setEditor(structuredClone(blank))}
            >
              <Plus size={16} /> Create product
            </button>
          )}
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
        {tab === "overview" && (
          <>
            <div className="metrics-grid">
              {[
                ["Orders", data.metrics.orders],
                [
                  "Booked value · unpaid COD",
                  money(data.metrics.booked, data.settings.currency),
                ],
                ["Customer accounts", data.metrics.customers],
                ["Pairs in inventory", data.metrics.inventory],
              ].map(([label, value]) => (
                <div className="metric-card" key={label}>
                  <span className="eyebrow">{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <section className="admin-section">
              <h2>Order status</h2>
              <div className="order-status-grid">
                {Object.keys(allowed).map((status) => {
                  const count = data.orders.filter(
                    (o) => o.status === status,
                  ).length;
                  return (
                    <div key={status}>
                      <strong>{count}</strong>
                      <span>{status}</span>
                      <div className="status-meter">
                        <span
                          style={{
                            width: `${data.orders.length ? (count / data.orders.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="small muted">
                Booked value excludes cancellations and is not collected
                revenue. Cash-on-delivery orders remain unpaid in this
                demonstration.
              </p>
            </section>
            <section className="admin-section">
              <h2>Recently placed</h2>
              {data.orders.length ? (
                data.orders.slice(0, 5).map((order) => (
                  <div className="admin-order-line" key={order.id}>
                    <span>{order.id.slice(0, 8).toUpperCase()}</span>
                    <strong>{order.recipient}</strong>
                    <span>{order.status}</span>
                    <span>{money(order.total, order.currency)}</span>
                  </div>
                ))
              ) : (
                <p>
                  No orders yet. Complete a storefront checkout to create the
                  first record.
                </p>
              )}
            </section>
          </>
        )}
        {tab === "products" && (
          <>
            <label className="admin-search">
              Find a product
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Name or category"
              />
            </label>
            <p className="small muted">
              {filtered.length} products. Prices are displayed in major units;
              stored in integer minor units.
            </p>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Visibility</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(page * 20, (page + 1) * 20).map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        <span className="small muted block">
                          {product.slug}
                        </span>
                      </td>
                      <td>{product.category}</td>
                      <td>{money(product.price, data.settings.currency)}</td>
                      <td>
                        {product.variants.reduce((sum, v) => sum + v.stock, 0)}
                      </td>
                      <td>{product.active ? "Active" : "Hidden"}</td>
                      <td>
                        <button
                          className="text-btn"
                          onClick={() => setEditor(structuredClone(product))}
                        >
                          Edit <ArrowUpRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button
                className="btn btn-outline"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>
                Page {page + 1} of{" "}
                {Math.max(1, Math.ceil(filtered.length / 20))}
              </span>
              <button
                className="btn btn-outline"
                disabled={(page + 1) * 20 >= filtered.length}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
        {tab === "orders" && (
          <div className="admin-orders">
            {data.orders.map((order) => (
              <article className="admin-order-card" key={order.id}>
                <div className="flex justify-between flex-wrap gap-3">
                  <div>
                    <h3>
                      {order.id.slice(0, 8).toUpperCase()} / {order.recipient}
                    </h3>
                    <p>
                      {dateTime(order.createdAt, data.settings.timezone)} ·{" "}
                      {order.email}
                    </p>
                  </div>
                  <span className="status-tag">{order.status}</span>
                </div>
                <p>
                  {order.line}, {order.city}, {order.postal} · {order.phone}
                </p>
                <div className="small">
                  {order.items.map((item) => (
                    <div key={item.id}>
                      {item.productName} / EU {item.size} / {item.color} ×{" "}
                      {item.quantity}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-5">
                  <strong>
                    {money(order.total, order.currency)} / unpaid COD
                  </strong>
                  {allowed[order.status]?.map((status) => (
                    <button
                      key={status}
                      className={`btn ${status === "cancelled" ? "btn-outline" : "btn-dark"}`}
                      disabled={busy}
                      onClick={() => {
                        if (
                          status === "cancelled" &&
                          !window.confirm(
                            "Cancel this order and restore its stock?",
                          )
                        )
                          return;
                        void perform(() =>
                          api(`admin/orders/${order.id}`, { status }),
                        );
                      }}
                    >
                      {status === "cancelled"
                        ? "Cancel & restore stock"
                        : `Mark ${status}`}
                    </button>
                  ))}
                </div>
                <details className="mt-5">
                  <summary>Status timeline</summary>
                  {order.events.map((e) => (
                    <p key={e.id}>
                      {e.status} ·{" "}
                      {dateTime(e.createdAt, data.settings.timezone)}
                    </p>
                  ))}
                </details>
              </article>
            ))}
            {!data.orders.length && <p>No orders have been placed.</p>}
          </div>
        )}
        {tab === "enquiries" && (
          <div>
            {data.enquiries.map((enquiry) => (
              <article key={enquiry.id} className="admin-order-card">
                <h3>{enquiry.name}</h3>
                <p>
                  {enquiry.email} ·{" "}
                  {dateTime(enquiry.createdAt, data.settings.timezone)}
                </p>
                <p className="whitespace-pre-wrap">{enquiry.message}</p>
                <a className="text-btn" href={`mailto:${enquiry.email}`}>
                  Open your email client ↗
                </a>
              </article>
            ))}
            {!data.enquiries.length && <p>No customer enquiries yet.</p>}
            <p className="small muted">
              The app saves enquiries. It does not send email or SMS.
            </p>
          </div>
        )}
        {tab === "settings" && (
          <form
            key={JSON.stringify(data.settings)}
            className="settings-form grid grid-cols-1 sm:grid-cols-2 gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              const form = Object.fromEntries(new FormData(e.currentTarget));
              void perform(() =>
                api(
                  "admin/settings",
                  {
                    ...form,
                    shippingFee: Math.round(Number(form.shippingFee) * 100),
                    freeShipping: Math.round(Number(form.freeShipping) * 100),
                  },
                  "PUT",
                ),
              );
            }}
          >
            {(
              [
                "currency",
                "language",
                "timezone",
                "email",
                "phone",
                "address",
              ] as const
            ).map((key) => (
              <label key={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
                <input name={key} defaultValue={data.settings[key]} required />
              </label>
            ))}
            <label>
              Shipping fee (major currency units)
              <input
                name="shippingFee"
                type="number"
                min="0"
                step="0.01"
                defaultValue={data.settings.shippingFee / 100}
              />
            </label>
            <label>
              Free-shipping threshold (major units)
              <input
                name="freeShipping"
                type="number"
                min="0"
                step="0.01"
                defaultValue={data.settings.freeShipping / 100}
              />
            </label>
            {(["delivery", "returns"] as const).map((key) => (
              <label key={key} className="sm:col-span-2">
                {key === "delivery"
                  ? "Delivery information"
                  : "Returns information"}
                <textarea
                  aria-label={
                    key === "delivery"
                      ? "Delivery information"
                      : "Returns information"
                  }
                  name={key}
                  required
                  minLength={10}
                  defaultValue={data.settings[key]}
                  rows={4}
                />
              </label>
            ))}
            <button className="btn btn-dark" disabled={busy}>
              Save store settings
            </button>
            <p className="small muted">
              The default country is Pakistan. Replacing it or localizing all
              copy requires a separate integration.
            </p>
          </form>
        )}
        {editor && (
          <dialog
            ref={editorDialog}
            className="editor-backdrop"
            onCancel={(e) => {
              e.preventDefault();
              setEditor(null);
            }}
            aria-labelledby="editor-title"
          >
            <section className="product-editor" aria-labelledby="editor-title">
              <div className="flex justify-between">
                <h2 id="editor-title">
                  {editor.id ? "Edit product" : "Create product"}
                </h2>
                <button
                  className="icon-btn"
                  aria-label="Close product editor"
                  onClick={() => setEditor(null)}
                >
                  <X />
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    await perform(() =>
                      api(
                        editor.id
                          ? `admin/products/${editor.id}`
                          : "admin/products",
                        editor,
                        editor.id ? "PUT" : "POST",
                      ),
                    )
                  )
                    setEditor(null);
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(["name", "slug", "description", "materials"] as const).map(
                    (key) => (
                      <label
                        key={key}
                        className={
                          key === "description" || key === "materials"
                            ? "sm:col-span-2"
                            : ""
                        }
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                        <input
                          value={editor[key]}
                          required
                          onChange={(e) =>
                            setEditor({ ...editor, [key]: e.target.value })
                          }
                        />
                      </label>
                    ),
                  )}
                  <label>
                    Category
                    <select
                      value={editor.category}
                      onChange={(e) =>
                        setEditor({ ...editor, category: e.target.value })
                      }
                    >
                      {["Sneakers", "Running", "Casual", "Formal", "Boots"].map(
                        (x) => (
                          <option key={x}>{x}</option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    Price ({data.settings.currency})
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={editor.price / 100}
                      onChange={(e) =>
                        setEditor({
                          ...editor,
                          price: Math.round(Number(e.target.value) * 100),
                        })
                      }
                    />
                  </label>
                  <label>
                    Illustration / model accent
                    <input
                      type="color"
                      value={editor.accent}
                      onChange={(e) =>
                        setEditor({ ...editor, accent: e.target.value })
                      }
                    />
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editor.active}
                      onChange={(e) =>
                        setEditor({ ...editor, active: e.target.checked })
                      }
                    />{" "}
                    Visible in the storefront
                  </label>
                </div>
                <h3 className="mt-7">Purchasable variants</h3>
                <p className="small muted">
                  Existing SKU identity, size and colour are preserved for
                  historical orders. Set stock to zero to retire a variant.
                </p>
                <div className="table-scroll">
                  <table className="variant-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>EU</th>
                        <th>Colour</th>
                        <th>Hex</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editor.variants.map((variant, i) => (
                        <tr key={i}>
                          {(
                            [
                              "sku",
                              "size",
                              "color",
                              "colorHex",
                              "stock",
                            ] as const
                          ).map((field) => (
                            <td key={field}>
                              <input
                                aria-label={`${field} variant ${i + 1}`}
                                type={
                                  field === "stock" || field === "size"
                                    ? "number"
                                    : field === "colorHex"
                                      ? "color"
                                      : "text"
                                }
                                min={field === "stock" ? 0 : 30}
                                value={variant[field]}
                                readOnly={
                                  !!variant.productId &&
                                  ["sku", "size", "color"].includes(field)
                                }
                                onChange={(e) => {
                                  const next = [...editor.variants];
                                  next[i] = {
                                    ...variant,
                                    [field]:
                                      field === "stock" || field === "size"
                                        ? Number(e.target.value)
                                        : e.target.value,
                                  };
                                  setEditor({ ...editor, variants: next });
                                }}
                                required
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  className="text-btn mt-5"
                  onClick={() =>
                    setEditor({
                      ...editor,
                      variants: [
                        ...editor.variants,
                        {
                          sku: `${editor.slug || "new"}-${Date.now()}`,
                          productId: "",
                          size: 41,
                          color: "New colour",
                          colorHex: "#b6b6a7",
                          stock: 5,
                        },
                      ],
                    })
                  }
                >
                  <Plus size={16} /> Add variant
                </button>
                {error && (
                  <p className="error-box" role="alert">
                    {error}
                  </p>
                )}
                <div className="flex gap-4 mt-7">
                  <button className="btn btn-dark" disabled={busy}>
                    {busy ? "Saving…" : "Save product"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setEditor(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          </dialog>
        )}
      </div>
    </div>
  );
}
