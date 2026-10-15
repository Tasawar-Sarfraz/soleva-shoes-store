# SOLEVA — The Motion Atelier

“Built for your next move.” A complete local demonstration footwear store with an original ivory, graphite and lime visual system. Exactly **100 seeded sample products**: 30 Sneakers, 25 Running, 20 Casual, 15 Formal and 10 Boots. All products, locations and default contact details are fictional. Orders persist locally; no actual payment, shipping, email or SMS service is connected.

## Quick start

1. Install **Node.js 24 LTS** (tested with 24.19.0) and npm, plus Git for A-Frame’s pinned public source dependency. Other Node major versions are not the supported target. On Windows/macOS, use a normal terminal. On Linux, a C++ compiler, Python and make may be needed if the SQLite driver's verified prebuilt binary is unavailable.
2. Extract `soleva-shoes-store.zip`. It contains one folder named `soleva-shoes-store`.
3. Open a terminal inside that folder:

```sh
npm ci
npm run setup
npm run dev
```

4. Open `http://localhost:3000` in your own browser. The catalogue, cash-on-delivery checkout and all local experiences require no hosted database account or external API key.

The development server uses Webpack instead of Turbopack to avoid Turbopack's SST persistence allocation failures on memory-constrained machines. The seeded sample catalogue remains exactly 100 products.

`setup` generates a fresh cryptographically random secret in a new `.env`, copies local engine/font assets, applies versioned migrations and seeds the catalogue. It preserves existing configuration values, fills only a missing or empty development-secret slot, and keeps existing passwords, inventory, user data and seeded products intact. If you already have configuration, preserve it and ensure `BETTER_AUTH_SECRET` has at least 32 random characters. Back up the database before changing schema or data.

### Local demonstration accounts

Only enabled when `SEED_DEMO_ACCOUNTS=true` during seeding:

| Role | Email | Local demo password |
| --- | --- | --- |
| Administrator | `admin@soleva.example` | `MoveWithSoleva!24` |
| Customer | `customer@soleva.example` | `MoveWithSoleva!24` |

These are intentionally public **demonstration credentials**, not real secrets. Use the login page; the administrator can enter `/admin` from the account page. Accounts are stored through Better Auth using its supported email/password flow and scrypt hashing. The seed does not replace an existing account with a matching email or grant it a different role. Registration cannot supply an administrator role.

Never expose the demo accounts on a real public deployment. Disable `SEED_DEMO_ACCOUNTS` before the first production seed and provision an administrator yourself (see below). Changing that flag after seeding does not remove already-created demo accounts.

## Production mode locally

Stop `npm run dev` before starting another Next server in the same checkout.

```sh
npm run build
npm run start
```

Keep the same database and `.env`. For a different host or port, set **both** `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the actual trusted origin; rebuild after changing public configuration. API writes reject other origins. For example, when using port 3200, both values must be `http://localhost:3200` and start with `npm run start -- --port 3200`.

## What works

- Server-rendered catalogue, name/category search, genuine size/colour SKU filtering, price and stock filters, sorting, shareable filter URLs and accurate result counts.
- Product galleries with original local illustrations, EU size guide, genuine variant selection, sold-out states, quantity selection and related products.
- Persisted guest bag and wishlist with Zustand, server-side bag quotes and stock checks. Signed-in wishlists persist in SQLite.
- Validated cash-on-delivery checkout, configurable shipping (default PKR 350 below PKR 15,000), persistent orders and private guest-order access.
- SQLite `BEGIN IMMEDIATE` transactions serialize stock writes. Stock decrement, order items and status creation commit together. An idempotency key binds one checkout attempt to its validated payload and actor; retries return the same order without repeated stock deductions. Browser prices, discounts and totals are ignored.
- Customer registration/login/logout, profile names, saved address creation/editing/deletion, order history, status timelines and printable receipts. Anonymous callers and other customers cannot read a customer order. Keep guest receipt URLs private: they contain a bearer access token; the database stores its hash.
- Server-protected administration: product creation/editing, prices and genuine SKU inventory, orders, permitted status transitions, enquiries, shipping/store settings and metrics from actual database rows. Existing SKU size and colour are immutable for historical order integrity. Set stock to zero to retire a SKU; hide a product to retire it from the storefront.
- Orders can progress `placed → confirmed → shipped → delivered`, or be cancelled before shipment. Cancellation restores inventory exactly once. Orders remain unpaid in this demonstration, including delivered orders. Booked value is not collected revenue.
- A contact form that saves enquiries, clearly stating that no email is sent.

No coupon or card-payment engine is included. There are no invented testimonials, countdowns or live shipment claims. Register an account before checking out if you want that order in account history; guest orders are not silently attached later by matching an email address.

## 3D architecture

All essential artwork, fonts, procedural model code and fallback graphics are local. No GLB file or remote texture is required. Category-specific models are reusable design illustrations with configured colours, not 100 individual shoe scans.

| Experience | Technology | Behaviour |
| --- | --- | --- |
| Hero / design viewer | Three.js, React Three Fiber, Drei | Six product-specific procedural design variations per category, six genuine colour variants per sample product, controlled hero motion, orbit controls, material hotspots, HTML construction notes, exploded layers, preview colours and monograms |
| Sole Lab | Babylon.js | Isolated three-layer cross-section and illustrative flex slider; no scientific performance claims |
| Virtual showroom | A-Frame | On-demand same-origin iframe with clickable exhibits and HTML, keyboard, mouse and touch alternatives; WebXR starts only after the explicit immersive-mode button |
| Store explorer | CesiumJS | Local basic ellipsoid globe, original outline and three fictional showroom pins; no token or external imagery; all Workers, Assets, Widgets and ThirdParty paths are copied to `public/cesium` |
| Brand exhibit | Spline integration slot | **No licensed Spline scene is bundled.** Original local R3F fallback works; an optional genuine scene can be configured |
| Monogram placement | gl-matrix | Separate tested vector and transform calculations used by the design preview |

`ExperienceHub` owns one modal experience. Opening it unmounts the hero renderer; closing/switching or navigating unmounts the active secondary engine. Babylon, A-Frame, Cesium and Spline are dynamically loaded only when selected. Canvas rendering pauses on hidden tabs; observers, context listeners, loops and engines are disposed. Device pixel ratio is capped; “Reduce effects,” system reduced motion and quality preferences keep shopping usable on ordinary devices. HTML explanations, controls and illustrations work without WebGL. Re-run `npm run db:seed` after an update to add new colour/size variants to an existing local catalogue; existing stock and order records are preserved.

### Optional Spline asset

Supply a genuine HTTPS Spline scene you own or are licensed to use in `NEXT_PUBLIC_SPLINE_SCENE_URL`, then rebuild. Permit its actual asset domains in your host's network policy. An invalid or unavailable scene falls back locally. No Spline scene URL has been fabricated. Real scene licensing, network availability and its performance must be checked by the operator. Core shopping requires none of these assets.

### Store settings

The dashboard configures currency, locale/language tag, timezone, shipping, store contact details and information copy. Default values are PKR, English (`en-PK`), Asia/Karachi and demonstration shipping. Amounts are stored as integer minor currency units; changing the currency label does not convert catalogue prices. English storefront copy is bundled; translated copy can be added in the source. Default country is Pakistan. Store location examples are defined separately in `src/lib/locations.ts` and remain clearly fictional.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

For browser tests, stop the development server first. Install Playwright's Chromium once, then run:

```sh
npx playwright install chromium
npm run test:e2e
```

On Linux, Playwright may also require its documented system dependencies. If you already have Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its path (the cloud checks used `/usr/bin/chromium`). The browser suite starts its own server on port 3100 and seeds a **separate per-run database** under `data/e2e-*.sqlite`; it does not modify the normal application database. Do not run it against real customer data.

`npm run verify` runs type checking, lint, unit/integration tests and the production build. Unit tests use a temporary SQLite database, including two separate processes competing for the last item. See `TEST-REPORT.md` for checks actually executed and limits, rather than assumptions.

All scripts: `dev`, `build`, `start`, `typecheck`, `lint`, `test`, `test:e2e`, `db:migrate`, `db:seed`, `setup`, `assets`, `verify`.

## Source map

- `src/app`: App Router pages, server-protected administration and API handlers.
- `src/components`: Shopping, account, administration and responsive presentation.
- `src/components/three`: Isolated browser rendering engines and accessible controls.
- `src/server`: Drizzle schema, Better Auth, SQLite and transactional commerce logic.
- `src/lib`: Validation, catalogue, filtering, browser state, formatters and design math.
- `migrations`: Ordered SQL migrations, tracked by `_migrations`.
- `scripts`: Repeatable setup, assets, migration and seed commands.
- `public`: Original SVG illustrations, local font, viewer document, Cesium and A-Frame assets.
- `tests`: Meaningful commerce tests and browser journeys.

## Hosting and durable storage

Use a Node.js 24 server with a **persistent writable disk** for `DATABASE_PATH` and SQLite WAL/SHM files. Ephemeral or ordinary serverless filesystem hosting will lose orders and is not a supported database deployment. This design is suitable for a single application host; it is not a distributed inventory architecture. SQLite serializes concurrent writers across processes on the same local filesystem. Do not place WAL databases on an unsupported network filesystem.

Back up using SQLite's backup API or a consistent snapshot; copying only the database while it is being written can omit WAL transactions. Maintain tested backups, retention and recovery. Never put the database in `public/` or distribute customer data in the ZIP. Use HTTPS, secure random secrets, correct origin configuration and your host's supported process management. Rotate the secret carefully: it invalidates existing guest access keys and sessions.

To provision a real administrator with demo seeding disabled, register the desired account through the supported flow, verify its identity out of band, then use an operator-controlled SQLite session to update **that exact user's** `role` to `admin`. No public self-promotion API exists. Remove demo accounts and their sessions from any public deployment; do not reset existing user data blindly.

Production requirements beyond this local store include real inventory/product information, actual delivery/returns and legal policies, monitored fulfilment, email verification/recovery provider, distributed abuse protection if scaled, and any explicit payment integration. Password recovery and email verification delivery are not configured. Never mark card payments paid from a browser redirect; use a verified provider event if integrating payments.

## Reproducibility and dependencies

Use `npm ci` and the included `package-lock.json`; no forced peer resolution or disabled TLS/checksum validation is needed. Next/React/R3F/Babylon/Cesium/Better Auth versions were checked against published peer dependencies and official source documentation. ESLint 10 uses compatible TypeScript, React Hooks and Next plugins directly; older bundled `eslint-config-next` plugins did not yet support it. A-Frame's upstream Git dependency is pinned to its immutable commit and verified against the installed JavaScript source. Asset origins and licence texts are in `ASSET-LICENSES.md` and `public/licenses`.

## Packaging

The ZIP contains one `soleva-shoes-store/` folder with source, migrations, local assets, one npm lockfile, configuration templates and documentation. It excludes `node_modules`, `.next`, `.git`, `.env`, SQLite databases, browser reports and other temporary outputs. Generated development secrets and any customer/order data are never bundled.
