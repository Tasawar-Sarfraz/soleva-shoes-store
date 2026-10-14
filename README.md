# SOLEVA shoes store

Runnable Next.js App Router foundation for the SOLEVA shoes-store project.
This initial commit enables Codex Cloud checkout, dependency installation, and
application checks. It is a development starter; ecommerce and 3D features are
not implemented yet.

## Requirements

- Node.js 22.13 or newer (Node.js 24 recommended for this workspace).
- npm.

## Install and run

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Set `PORT` when the environment requires a
different port. The server listens on `0.0.0.0`.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
npm run start
```

The health endpoint is `GET /api/health`.

## Codex Cloud setup

1. Resume onboarding for this repository and select `main`.
2. Install with `npm ci` and run the checks above.
3. Review and save the environment draft, then publish the prepared environment.
4. Start a task with the complete SOLEVA build prompt.

Publishing an environment saves the reusable development setup.

## Planned application

Premium shoes storefront; 100 sample products; SKU stock; search and filters;
cart, wishlist, checkout, customer accounts and admin tools; persistent storage;
Three.js with React Three Fiber and Drei as the primary viewer; isolated
Babylon, A-Frame and Cesium experiences where useful; Zustand UI state;
gl-matrix calculations and optional real Spline assets. The final project
should be tested and packaged as one ZIP.
