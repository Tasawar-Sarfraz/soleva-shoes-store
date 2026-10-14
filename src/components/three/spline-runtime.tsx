"use client";
// A static ESM boundary keeps Next's dynamic-loader require.resolveWeak call
// on our own module, while respecting the Spline package's import-only export.
export { default } from "@splinetool/react-spline";
