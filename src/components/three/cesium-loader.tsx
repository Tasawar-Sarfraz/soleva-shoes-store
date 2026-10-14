"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const Globe = dynamic(() => import("./cesium-stores"), {
  ssr: false,
  loading: () => <p role="status">Preparing the local globe…</p>,
});
export default function CesiumLoader() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Object.assign(window, { CESIUM_BASE_URL: "/cesium/" });
    queueMicrotask(() => setReady(true));
  }, []);
  return ready ? <Globe /> : <p role="status">Preparing local assets…</p>;
}
