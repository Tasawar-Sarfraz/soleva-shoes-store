"use client";
import { useRef } from "react";
import Link from "next/link";
import { sampleCatalogue } from "@/lib/catalogue";
export default function AframeShowroom() {
  const frame = useRef<HTMLIFrameElement>(null);
  const designs = sampleCatalogue().filter((p) =>
    ["sneakers-01", "running-01", "formal-01"].includes(p.id),
  );
  return (
    <div className="experience-layout">
      <div className="scene-window iframe-window">
        <iframe
          ref={frame}
          src="/showroom/index.html"
          title="Optional immersive SOLEVA showroom"
          allow="xr-spatial-tracking; fullscreen"
        />
      </div>
      <div className="viewer-controls">
        <span className="eyebrow">A-FRAME / OPTIONAL SHOWROOM</span>
        <h3>
          Step into
          <br />
          the exhibition.
        </h3>
        <p>
          A small architectural showroom with fictional product displays. Drag
          to look around; use the in-scene HTML controls or your keyboard.
        </p>
        <button
          className="btn btn-dark"
          onClick={() =>
            frame.current?.contentWindow?.postMessage(
              { type: "soleva-enter-xr" },
              window.location.origin,
            )
          }
        >
          Enter immersive mode ↗
        </button>
        <p className="small muted">
          WebXR starts only from this button on supported devices. Ordinary
          shopping remains available below.
        </p>
        <div className="showroom-product-links">
          {designs.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`}>
              {product.name} / {product.category} ↗
            </Link>
          ))}
        </div>
        <button
          className="btn btn-outline"
          onClick={() =>
            frame.current?.contentWindow?.postMessage(
              { type: "soleva-reset" },
              window.location.origin,
            )
          }
        >
          Reset view
        </button>
      </div>
    </div>
  );
}
