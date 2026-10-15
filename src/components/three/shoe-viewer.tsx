"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Product } from "@/lib/types";
import { useShopping } from "@/lib/client-store";
import { useVisibleScene, useWebGL } from "./webgl";
import { monogramTransform } from "@/lib/design-math";
import { shoeDesignIndex } from "@/lib/shoe-design";
const ShoeScene = dynamic(() => import("./shoe-scene"), { ssr: false });
const Label = dynamic(() => import("./monogram"), { ssr: false });
const notes: Record<string, string> = {
  upper:
    "01 / Upper — a procedural textile or leather-look silhouette. Category models use different profiles; these are design illustrations.",
  laces:
    "02 / Laces — a simple crossing system holds the upper together. The exploded view separates it for inspection.",
  midsole:
    "03 / Midsole — the sculpted pale layer defines the shoe profile. No cushioning or performance measurement is claimed.",
  outsole:
    "04 / Outsole — the darker tread layer provides a visual foundation. The Sole Lab explores an illustrative cross-section.",
};
export default function ShoeViewer({ product }: { product: Product }) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useVisibleScene(ref);
  const webgl = useWebGL();
  const [failed, setFailed] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [part, setPart] = useState("upper");
  const [angle, setAngle] = useState(0);
  const selection = useShopping((s) => s.selections[product.id]);
  const variant =
    product.variants.find((v) => v.sku === selection) || product.variants[0];
  const [color, setColor] = useState(variant?.colorHex || product.accent);
  const [mark, setMark] = useState("");
  const [offset, setOffset] = useState(0);
  const [markAngle, setMarkAngle] = useState(0);
  const transform = monogramTransform(offset, markAngle, 1);
  return (
    <div className="experience-layout">
      <div className="scene-window" ref={ref}>
        {webgl && !failed ? (
          <ShoeScene
            category={product.category}
            color={color}
            designIndex={shoeDesignIndex(product.id)}
            active={active}
            explode={exploded ? 1 : 0}
            rotation={(angle * Math.PI) / 180}
            onFailure={() => setFailed(true)}
            onPart={setPart}
            monogram={
              mark ? <Label text={mark} transform={transform} /> : undefined
            }
          />
        ) : (
          <div className="scene-fallback">
            <Image
              src={product.image}
              width={700}
              height={480}
              alt={`${product.name} fallback illustration`}
            />
            <p role="status">
              WebGL is unavailable. Explore the construction notes and product
              illustrations.
            </p>
          </div>
        )}
        <span className="scene-annotation">DRAG TO ORBIT / SCROLL TO ZOOM</span>
      </div>
      <div className="viewer-controls">
        <span className="eyebrow">
          {product.category.toUpperCase()} / DESIGN STUDY
        </span>
        <h3>{product.name}</h3>
        <p className="small">
          Reusable category model, configured for this design. Use the HTML
          controls to inspect every part.
        </p>
        <button
          className="btn btn-dark"
          aria-pressed={exploded}
          onClick={() => setExploded(!exploded)}
        >
          {exploded ? "Assemble the shoe" : "Explode the layers"} ↗
        </button>
        <label>
          Rotate the shoe
          <input
            type="range"
            min="-180"
            max="180"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
          />
        </label>
        <div className="part-tabs">
          {Object.keys(notes).map((key) => (
            <button
              key={key}
              className={part === key ? "current" : ""}
              onClick={() => setPart(key)}
            >
              {key}
            </button>
          ))}
        </div>
        <p className="anatomy-note">{notes[part]}</p>
        <details>
          <summary>Personalisation preview</summary>
          <p className="small">
            Experimental colour and monogram previews cannot be ordered.
          </p>
          <label>
            Preview colour
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </label>
          <label>
            Monogram (max. 3 letters)
            <input
              maxLength={3}
              value={mark}
              onChange={(e) =>
                setMark(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase())
              }
            />
          </label>
          <label>
            Placement
            <input
              type="range"
              min="-1"
              max="1"
              step=".05"
              value={offset}
              onChange={(e) => setOffset(Number(e.target.value))}
            />
          </label>
          <label>
            Monogram angle
            <input
              type="range"
              min="-30"
              max="30"
              value={markAngle}
              onChange={(e) => setMarkAngle(Number(e.target.value))}
            />
          </label>
          <span className="tiny">PLACEMENT CALCULATED WITH GL-MATRIX</span>
        </details>
      </div>
    </div>
  );
}
