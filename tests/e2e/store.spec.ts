import {
  test as base,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import { createHash } from "node:crypto";
// Separate journeys represent independent clients behind a trusted test proxy.
// Authentication rate limiting remains enabled and is tested explicitly below.
const test = base.extend({
  extraHTTPHeaders: async ({ baseURL }, use, testInfo) => {
    const hash = createHash("sha256")
      .update(`${baseURL}:${testInfo.title}`)
      .digest();
    await use({ "x-forwarded-for": `198.51.${hash[0]}.${hash[1]}` });
  },
});
const origin = "http://localhost:3100";
let errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
    if (/hydration|did not match/i.test(message.text()))
      errors.push(message.text());
  });
});
test.afterEach(async () => {
  expect(errors, "No browser errors or hydration warnings").toEqual([]);
});
async function login(page: Page, email = "customer@soleva.example") {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("MoveWithSoleva!24");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account/);
}
async function apiLogin(
  request: APIRequestContext,
  email = "admin@soleva.example",
) {
  const result = await request.post("/api/auth/sign-in/email", {
    headers: { Origin: origin },
    data: { email, password: "MoveWithSoleva!24" },
  });
  expect(result.status()).toBe(200);
}
test("catalogue search, shared filters, result counts and empty state", async ({
  page,
}) => {
  await page.goto("/shop");
  await expect(page.getByText("100 designs found")).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(100);
  await page.getByLabel("Search", { exact: true }).fill("Arc 01");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText("1 design found")).toBeVisible();
  await expect(page).toHaveURL(/q=Arc/);
  await page.getByLabel("Search", { exact: true }).fill("");
  await page.getByLabel("Category", { exact: true }).selectOption("Sneakers");
  await page.getByLabel("Size (EU)", { exact: true }).selectOption("39");
  await page.getByLabel("Colour", { exact: true }).selectOption("Chalk");
  await page
    .getByLabel("Availability", { exact: true })
    .selectOption("available");
  await page.getByLabel("Sort by", { exact: true }).selectOption("price-desc");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/size=39/);
  expect(await page.locator(".product-card").count()).toBeGreaterThan(0);
  await page.getByLabel("Search", { exact: true }).fill("No-such-design");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText("No designs in this view.")).toBeVisible();
});
test("customer variant selection, persistent bag, edits, checkout and owned receipt", async ({
  page,
  browser,
}) => {
  await login(page);
  await page.goto("/products/arc-01-sneakers");
  await page
    .getByRole("button", { name: "Size 39 sold out", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Add to bag" })).toBeDisabled();
  await page.getByRole("button", { name: "Size 42", exact: true }).click();
  await page
    .getByRole("button", { name: "Colour Graphite", exact: true })
    .click();
  await expect(page.locator(".stock-info")).toContainText("pairs available");
  await page
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.getByRole("link", { name: "View bag →" }).click();
  await expect(page.locator(".cart-line")).toHaveCount(1);
  await expect(page.locator(".cart-line")).toContainText("EU 42 / Graphite");
  await page.reload();
  await expect(page.locator(".quantity-control>span")).toHaveText("2");
  await page.getByRole("button", { name: "Increase Arc 01 quantity" }).click();
  await expect(page.locator(".quantity-control>span")).toHaveText("3");
  await page.getByRole("button", { name: "Decrease Arc 01 quantity" }).click();
  await expect(page.locator(".quantity-control>span")).toHaveText("2");
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await page.getByLabel("Full name", { exact: true }).fill("E2E Customer");
  await page
    .getByLabel("Phone number", { exact: true })
    .fill("+92 300 1234567");
  await page.getByLabel("City", { exact: true }).fill("Karachi");
  await page
    .getByLabel("Street address", { exact: true })
    .fill("42 Test Avenue, Clifton");
  await page.getByLabel("Postal code", { exact: true }).fill("75500");
  await page
    .getByRole("button", { name: "Place cash-on-delivery order" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Order received." }),
  ).toBeVisible();
  await expect(page.getByText("Cash on delivery / unpaid")).toBeVisible();
  const receipt = new URL(page.url());
  const id = receipt.pathname.split("/").at(-1)!;
  await page.goto(receipt.pathname);
  await expect(
    page.getByRole("heading", { name: "Order received." }),
  ).toBeVisible();
  const outsider = await browser.newContext();
  const response = await outsider.request.get(
    `${origin}/api/store/orders/${id}`,
  );
  expect(response.status()).toBe(404);
  await outsider.close();
  await page.goto("/account");
  await expect(page.locator(".account-order")).toHaveCount(1);
});
test("guest checkout retries are idempotent and guest access is protected", async ({
  request,
}) => {
  const payload = {
    recipient: "Guest Test",
    email: "guest@soleva.example",
    phone: "+92 300 1234567",
    line: "99 Guest Test Street",
    city: "Lahore",
    postal: "54000",
    items: [{ sku: "casual-01-40-0", quantity: 1 }],
    idempotencyKey: crypto.randomUUID(),
    price: 1,
    total: 0,
  };
  const first = await request.post("/api/store/checkout", {
    headers: { Origin: origin },
    data: payload,
  });
  expect(first.status()).toBe(201);
  const saved = await first.json();
  const retry = await request.post("/api/store/checkout", {
    headers: { Origin: origin },
    data: payload,
  });
  expect((await retry.json()).id).toBe(saved.id);
  expect((await request.get(`/api/store/orders/${saved.id}`)).status()).toBe(
    404,
  );
  const receipt = await request.get(
    `/api/store/orders/${saved.id}?access=${saved.access}`,
  );
  expect(receipt.status()).toBe(200);
  const order = await receipt.json();
  expect(order.total).toBeGreaterThan(100);
  expect(order.paymentStatus).toBe("unpaid");
});
test("registration, profile, address edits, persistent wishlist and logout", async ({
  page,
}) => {
  await page.goto("/login");
  await page
    .getByRole("button", { name: "New here? Create an account ↗" })
    .click();
  await page
    .getByLabel("Full name", { exact: true })
    .fill("New Atelier Customer");
  await page
    .getByLabel("Email address", { exact: true })
    .fill(`new-${Date.now()}@soleva.example`);
  await page
    .getByLabel("Password", { exact: true })
    .fill("A-New-Strong-Password!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/\/account/);
  await page
    .getByLabel("Display name", { exact: true })
    .fill("Updated Customer");
  await page
    .getByRole("button", { name: "Update profile", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Hello, Updated." }),
  ).toBeVisible();
  for (const [name, value] of [
    ["Address label", "Home"],
    ["Recipient", "Updated Customer"],
    ["Phone", "+92 300 1234567"],
    ["City", "Karachi"],
    ["Street address", "123 Customer Address"],
    ["Postal code", "75500"],
  ])
    await page.getByLabel(name, { exact: true }).fill(value);
  await page.getByRole("button", { name: "Save address", exact: true }).click();
  await expect(page.locator(".address-card")).toContainText("Home");
  await page
    .locator(".address-card")
    .getByRole("button", { name: "Edit", exact: true })
    .click();
  await page.getByLabel("City", { exact: true }).fill("Lahore");
  await page.getByRole("button", { name: "Save address", exact: true }).click();
  await expect(page.locator(".address-card")).toContainText("Lahore");
  await page.goto("/products/arc-01-sneakers");
  await page
    .getByRole("button", { name: "Save Arc 01 to wishlist", exact: true })
    .click();
  await page.goto("/wishlist");
  await page.reload();
  await expect(page.locator(".product-card")).toContainText("Arc 01");
  await page.goto("/account");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(`${origin}/`);
  expect((await page.request.get("/api/store/account")).status()).toBe(401);
});
test("administration rejects unauthenticated and customer API calls", async ({
  request,
}) => {
  expect((await request.get("/api/store/admin/overview")).status()).toBe(401);
  expect(
    (
      await request.put("/api/store/admin/settings", {
        headers: { Origin: origin },
        data: {},
      })
    ).status(),
  ).toBe(401);
  await apiLogin(request, "customer@soleva.example");
  expect((await request.get("/api/store/admin/overview")).status()).toBe(403);
  expect(
    (
      await request.post("/api/store/admin/orders/fake", {
        headers: { Origin: origin },
        data: { status: "cancelled" },
      })
    ).status(),
  ).toBe(403);
});
test("admin UI saves stock and price changes to actual variants", async ({
  page,
}) => {
  await login(page, "admin@soleva.example");
  await page.goto("/admin");
  await page.getByRole("button", { name: "Products", exact: true }).click();
  await page.getByLabel("Find a product", { exact: true }).fill("Arc 01");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const editor = page.getByRole("dialog");
  await expect(editor).toBeVisible();
  await editor.getByLabel("stock variant 2", { exact: true }).fill("4");
  await editor.getByLabel("Price (PKR)", { exact: true }).fill("12000");
  await editor
    .getByRole("button", { name: "Save product", exact: true })
    .click();
  await expect(editor).not.toBeVisible();
  await expect(page.getByText("Changes saved to the database.")).toBeVisible();
  const response = await page.request.get("/api/store/products?q=Arc%2001");
  const products = await response.json();
  expect(products[0].price).toBe(1200000);
  expect(
    products[0].variants.find(
      (v: { sku: string }) => v.sku === "sneakers-01-40-0",
    ).stock,
  ).toBe(4);
});
test("admin creates products, updates settings and persists contact enquiries", async ({
  page,
}) => {
  await page.goto("/contact");
  await page.getByLabel("Your name", { exact: true }).fill("Browser Enquiry");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("enquiry@soleva.example");
  await page
    .getByLabel("How can we help?", { exact: true })
    .fill("Please explain the sample boot sizing options.");
  await page.getByRole("button", { name: "Save your enquiry" }).click();
  await expect(
    page.getByText(
      "Your enquiry has been saved for the store team. This demo does not send email.",
    ),
  ).toBeVisible();
  await login(page, "admin@soleva.example");
  await page.goto("/admin");
  await page.getByRole("button", { name: "Enquiries", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Browser Enquiry" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Products", exact: true }).click();
  await page
    .getByRole("button", { name: "Create product", exact: true })
    .click();
  const editor = page.getByRole("dialog");
  await editor.getByLabel("Name", { exact: true }).fill("Browser Studio");
  await editor.getByLabel("Slug", { exact: true }).fill("browser-studio");
  await editor
    .getByRole("button", { name: "Save product", exact: true })
    .click();
  await expect(editor).not.toBeVisible();
  await page.goto("/products/browser-studio");
  await expect(
    page.getByRole("heading", { name: "Browser Studio", exact: true }),
  ).toBeVisible();
  await page.goto("/admin");
  await page
    .getByRole("button", { name: "Store settings", exact: true })
    .click();
  await page
    .getByLabel("Delivery information", { exact: true })
    .fill(
      "Demonstration delivery estimate: 3–5 working days. Browser-verified setting.",
    );
  await page
    .getByRole("button", { name: "Save store settings", exact: true })
    .click();
  await expect(page.getByText("Changes saved to the database.")).toBeVisible();
  await page.goto("/information");
  await expect(page.getByText(/Browser-verified setting/)).toBeVisible();
});
test("admin cancellation restores inventory once and status transitions are enforced", async ({
  request,
}) => {
  const products = await (
    await request.get("/api/store/products?q=Pace%2001")
  ).json();
  const variant = products[0].variants.find(
    (x: { size: number; stock: number }) => x.size === 42 && x.stock > 0,
  );
  const input = {
    recipient: "Cancellation Test",
    email: "cancel@soleva.example",
    phone: "+92 300 1234567",
    line: "11 Cancel Test Street",
    city: "Karachi",
    postal: "75500",
    items: [{ sku: variant.sku, quantity: 1 }],
    idempotencyKey: crypto.randomUUID(),
  };
  const result = await request.post("/api/store/checkout", {
    headers: { Origin: origin },
    data: input,
  });
  expect(result.status()).toBe(201);
  const order = await result.json();
  await apiLogin(request);
  expect(
    (
      await request.post(`/api/store/admin/orders/${order.id}`, {
        headers: { Origin: origin },
        data: { status: "delivered" },
      })
    ).status(),
  ).toBe(409);
  for (let i = 0; i < 2; i++)
    expect(
      (
        await request.post(`/api/store/admin/orders/${order.id}`, {
          headers: { Origin: origin },
          data: { status: "cancelled" },
        })
      ).status(),
    ).toBe(200);
  const after = await (
    await request.get("/api/store/products?q=Pace%2001")
  ).json();
  expect(
    after[0].variants.find((x: { sku: string }) => x.sku === variant.sku).stock,
  ).toBe(variant.stock);
});
for (const width of [360, 390, 768, 1440])
  test(`responsive layouts and accessible navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/shop?category=Boots",
      "/products/arc-01-sneakers",
      "/login",
      "/stores",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${route} has no horizontal overflow`,
      ).toBe(true);
      await page.screenshot({
        path: `test-results/layout-${width}-${route === "/" ? "home" : route.split("/")[1]}.png`,
        fullPage: true,
      });
    }
    if (width < 768) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await expect(
        page.getByRole("navigation", { name: "Mobile navigation" }),
      ).toBeVisible();
      await page
        .getByRole("navigation", { name: "Mobile navigation" })
        .getByRole("link", { name: "Collection" })
        .click();
      await expect(page).toHaveURL(/\/shop/);
    }
  });
test("mobile bag editing and cash-on-delivery checkout at 390px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/products/daybreak-01-casual");
  await page.getByRole("button", { name: "Size 42", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.getByRole("link", { name: "View bag →" }).click();
  await page
    .getByRole("button", { name: "Increase Daybreak 01 quantity" })
    .click();
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  for (const [name, value] of [
    ["Full name", "Mobile Guest"],
    ["Email address", "mobile@soleva.example"],
    ["Phone number", "+92 300 1234567"],
    ["City", "Karachi"],
    ["Street address", "10 Mobile Test Street"],
    ["Postal code", "75500"],
  ])
    await page.getByLabel(name, { exact: true }).fill(value);
  await page
    .getByRole("button", { name: "Place cash-on-delivery order" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Order received." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("R3F viewer opens, explodes, applies preview and closes without extra canvases", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore the design", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("canvas")).toHaveCount(1, { timeout: 60000 });
  expect(await page.locator("canvas").count()).toBe(1);
  await dialog.getByRole("button", { name: "Explode the layers" }).click();
  await expect(
    dialog.getByRole("button", { name: "Assemble the shoe" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "laces", exact: true }).click();
  await expect(dialog.getByText(/02 \/ Laces/)).toBeVisible();
  await dialog.getByText("Personalisation preview", { exact: true }).click();
  await dialog
    .getByLabel("Monogram (max. 3 letters)", { exact: true })
    .fill("SV");
  await dialog.getByRole("button", { name: "Close experience" }).click();
  await expect(dialog).not.toBeVisible();
  await page.goto("/shop");
  await expect(page.locator("canvas")).toHaveCount(0);
});
test("Babylon Sole Lab flex slider opens and disposes on close", async ({
  page,
}) => {
  await page.goto("/atelier");
  await page
    .locator(".exhibit-lab")
    .getByRole("button", { name: "Open experience" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("canvas")).toHaveCount(1, { timeout: 60000 });
  await dialog.getByLabel("Illustrative flex — 0%", { exact: true }).fill("70");
  await expect(dialog.getByText("Illustrative flex — 70%")).toBeVisible();
  await dialog.getByRole("button", { name: "Close experience" }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
});
test("A-Frame showroom uses its isolated document and accessible controls", async ({
  page,
}) => {
  await page.goto("/atelier");
  await page
    .locator(".exhibit-showroom")
    .getByRole("button", { name: "Open experience" })
    .click();
  const dialog = page.getByRole("dialog");
  const frame = page.frameLocator("iframe");
  await expect(frame.locator("a-scene canvas")).toHaveCount(1, {
    timeout: 60000,
  });
  await frame.getByRole("button", { name: "Arc display", exact: true }).click();
  await expect(frame.locator("#status")).toContainText("ARC DISPLAY");
  await expect(
    dialog.getByRole("link", { name: "Arc 01 / Sneakers ↗" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Close experience" }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
});
test("Cesium local globe loads its assets and selects a fictional showroom", async ({
  page,
}) => {
  const missing: string[] = [];
  page.on("response", (res) => {
    if (res.url().includes("/cesium/") && res.status() >= 400)
      missing.push(res.url());
  });
  await page.goto("/stores");
  await page.getByRole("button", { name: "Open the globe" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("canvas")).toHaveCount(1, { timeout: 60000 });
  await dialog
    .getByLabel("Select a showroom", { exact: true })
    .selectOption("lahore");
  await expect(
    dialog.getByRole("heading", { name: "Lahore / The Form Room" }),
  ).toBeVisible();
  expect(missing).toEqual([]);
  await dialog.getByRole("button", { name: "Close experience" }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
});
test("brand exhibit accurately uses the local R3F fallback", async ({
  page,
}) => {
  await page.goto("/atelier");
  await page
    .locator(".exhibit-brand")
    .getByRole("button", { name: "Open experience" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("BRAND EXHIBIT / LOCAL R3F")).toBeVisible();
  await expect(dialog.locator("canvas")).toHaveCount(1, { timeout: 60000 });
  await dialog.getByRole("button", { name: "Close experience" }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
});
test("WebGL failure leaves attractive 2D fallbacks and usable shopping", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind: string,
      ...args: unknown[]
    ) {
      if (kind === "webgl" || kind === "webgl2") return null;
      return Reflect.apply(original, this, [kind, ...args]);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator(".hero-poster")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Explore the design", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByText(
      "WebGL is unavailable. Explore the construction notes and product illustrations.",
    ),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Close experience" }).click();
  await page.goto("/products/arc-01-sneakers");
  await expect(page.getByRole("button", { name: "Add to bag" })).toBeEnabled();
});

test("authentication rate limiting remains enforced", async ({ request }) => {
  const statuses: number[] = [];
  for (let i = 0; i < 4; i++) {
    const result = await request.post("/api/auth/sign-in/email", {
      headers: { Origin: origin },
      data: {
        email: "not-a-user@soleva.example",
        password: "Wrong-Password-For-Test!",
      },
    });
    statuses.push(result.status());
  }
  expect(statuses.slice(0, 3).every((status) => status === 401)).toBe(true);
  expect(statuses[3]).toBe(429);
});

test("saved wishlists remain separate when accounts share a browser", async ({
  page,
}) => {
  await login(page);
  await page.goto("/products/arc-01-sneakers");
  await page
    .getByRole("button", { name: "Save Arc 01 to wishlist", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Remove Arc 01 from wishlist",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/account");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await login(page, "admin@soleva.example");
  await page.goto("/wishlist");
  await expect(page.locator(".product-card")).toHaveCount(0);
  await page.goto("/account");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await login(page);
  await page.goto("/wishlist");
  await expect(page.locator(".product-card")).toContainText("Arc 01");
});
