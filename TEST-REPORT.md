# SOLEVA verification report

Final verification completed on 14 October 2026. The checked development and production workflows pass the available checks. This does not promise permanent error-free behaviour on every host or device.

## Environment

Node.js 24.19.0, npm 11.9.0, Linux x64, Chromium with software WebGL. Next.js 16.4.0, React 19.3.0, strict TypeScript 6.0.2, Tailwind 4.3.3, Drizzle 0.45.4, Better Auth 1.7.7 and better-sqlite3 12.11.1 are pinned in the single npm lockfile. Published peer dependencies resolve successfully without forced resolution. The driver was pinned to a compatible maintained release after a clean install exposed an installation problem in the newer release.

## Executed outcomes

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed, strict types; also passed in the clean extracted project |
| `npm run lint` | Passed, 0 errors and 0 lint warnings; also passed in clean extraction |
| `npm test` | **19 passed, 0 failed, 0 skipped** in 1 test file; also passed in clean extraction |
| `npm run test:e2e` | **21 passed, 0 failed, 0 skipped** in the final full browser run |
| `npm run build` | Optimized production build passed, including the ESM-only Spline boundary; passed in clean extraction |
| `npm ci` from the ZIP in a clean directory | Passed, followed by fresh setup and verification; no existing dependencies or database supplied |
| Repeat `npm run setup` | Passed; original application database retained exactly 100 products, 1,200 genuine SKUs and no fabricated orders |
| `npm run start` from the extracted build | Passed, with actual storefront, authentication, transactional checkout, private receipt and admin metric checks |
| Each local 3D experience in production | Hero/design viewer, Babylon, A-Frame, Cesium and the local brand fallback rendered and closed successfully |
| Cesium development and production assets | Local globe and showroom selection passed; no missing Cesium asset requests |
| Production browser console / hydration | 0 errors; no hydration failures observed |
| Runtime `npm audit --omit=dev` | 0 reported runtime vulnerabilities at verification time |
| `npm ls --all --omit=optional` | Valid installed dependency graph; no invalid peer dependencies |
| Pinned upstream A-Frame Git dependency | 8 installed JavaScript files compared byte-for-byte with immutable commit `c3eec235b9188aa0d8ed949101236e6d5fccf071` |
| ZIP integrity and contents | CRC verified, one top-level folder, final source bytes matched, private configuration/databases and dependency/build folders excluded |

## What the tests exercise

The 19 commerce tests cover exactly 100 distinct sample products in the requested category counts; genuine size/colour SKU matching; sold-out, inactive and unknown products; quantity limits including duplicate SKU aggregation; shipping boundaries; fractional minor-unit price display; authoritative prices and ignored browser totals/discounts; persistent unpaid COD orders; idempotency and conflicting retries; transactional rollback; two separate processes competing for the last pair; customer ownership and secure guest access; permitted status changes; exactly-once cancellation inventory restoration; administrator authorization; repeatable seeding; and finite gl-matrix monogram transformations.

The 21 browser tests exercise searchable/shared filter URLs and counts; actual variants and sold-out controls; persisted guest bag and quantity editing; customer checkout and order history; private guest checkout/retries; registration, profile and address edits, database wishlist and logout; anonymous/customer rejection from admin APIs; administrator product creation, price/stock updates, store settings and saved enquiries; cancellation inventory; responsive layouts at **360, 390, 768 and 1440px**, with overflow checks; mobile navigation and checkout; opening/closing every local rendering experience; R3F exploded layers and monograms; Babylon flex; isolated A-Frame controls; Cesium showroom selection; accurate local Spline-slot fallback; simulated WebGL unavailability; authentication throttling; and wishlist separation when accounts share one browser.

Independent browser journeys use separate simulated client identities, as they would behind a trusted proxy. Authentication throttling remains enabled, and its rejection of excessive attempts is tested explicitly. Tests use separate temporary/per-run databases; no production customer data is used.

Production smoke checks additionally rendered the homepage and all five viewer paths from the optimized build, created one sample COD order in the isolated extracted database, replayed it without duplication, read its protected receipt, logged into administration, and verified a metric calculated from the real order row. All essential original artwork and both local font files were available. Production browser errors and missing Cesium assets were both zero.

## Corrected during verification

Accessible form naming, A-Frame renderer startup timing, Spline's import-only package boundary in the production bundler, native-driver clean installation, wishlist synchronization during account changes, fractional price formatting and touch-control sizing were corrected before final packaging. The final archive contains those corrections.

## Limits and expected notices

- Browser/device coverage is Chromium plus emulated viewport widths and software WebGL. Physical phones, their soft keyboards/GPUs, Safari, Firefox and real WebXR headsets were not tested. The immersive-mode entry requires explicit action and supported hardware.
- No genuine licensed Spline scene is supplied. The configured integration slot and original local R3F fallback are included; no fabricated scene URL or export is claimed. A future supplied scene needs its own licence/network/performance check.
- No real card gateway, delivery provider, email, SMS, verification-email or password-recovery provider is configured. Core checkout is a working local unpaid cash-on-delivery demonstration.
- Storefront copy is English. Currency/locale/timezone settings exist; complete translated copy and additional delivery countries are not bundled.
- Three.js emits a non-fatal Clock deprecation notice through the current R3F dependency. npm reports upstream deprecated helper packages `phin` and `prebuild-install`; the runtime vulnerability audit is clean. Git dependencies use an immutable commit rather than npm tarball integrity, so their installed source was independently checked. TLS and expected artifact verification were not disabled.
- No load benchmark, real fulfilment run, external asset integration, remote deployment or fresh Codex task restoration is claimed. Use a persistent writable local disk for SQLite and follow README production guidance.
