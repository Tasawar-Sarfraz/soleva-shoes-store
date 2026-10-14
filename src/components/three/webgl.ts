"use client";
import { useSyncExternalStore, useEffect, useState } from "react";
let supported: boolean | undefined;
export function hasWebGL() {
  if (supported !== undefined) return supported;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    supported = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    supported = false;
  }
  return supported;
}
const noop = () => () => {};
export function useWebGL() {
  return useSyncExternalStore(noop, hasWebGL, () => false);
}
export function useDocumentVisible() {
  return useSyncExternalStore(
    (callback) => {
      document.addEventListener("visibilitychange", callback);
      return () => document.removeEventListener("visibilitychange", callback);
    },
    () => !document.hidden,
    () => true,
  );
}
export function useReducedMotion() {
  return useSyncExternalStore(
    (callback) => {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      media.addEventListener("change", callback);
      return () => media.removeEventListener("change", callback);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}
export function useVisibleScene(ref: React.RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(true);
  useEffect(() => {
    let intersecting = true;
    const update = () => setActive(intersecting && !document.hidden);
    const observer = new IntersectionObserver((entries) => {
      intersecting = entries[0]?.isIntersecting ?? false;
      update();
    });
    if (ref.current) observer.observe(ref.current);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [ref]);
  return active;
}
