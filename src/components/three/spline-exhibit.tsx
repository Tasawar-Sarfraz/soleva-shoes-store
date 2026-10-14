"use client";
import Image from "next/image";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useWebGL } from "./webgl";
const Spline = dynamic(() => import("./spline-runtime"), {
  ssr: false,
});
const ShoeScene = dynamic(() => import("./shoe-scene"), { ssr: false });
export default function SplineExhibit() {
  const url = process.env.NEXT_PUBLIC_SPLINE_SCENE_URL;
  const webgl = useWebGL();
  const [useFallback, setUseFallback] = useState(false);
  const valid = !!url && url.startsWith("https://");
  return (
    <div className="experience-layout">
      <div className="scene-window">
        {webgl && valid && !useFallback ? (
          <Spline scene={url} onError={() => setUseFallback(true)} />
        ) : webgl ? (
          <ShoeScene
            category="Sneakers"
            color="#bed485"
            onFailure={() => setUseFallback(true)}
          />
        ) : (
          <div className="scene-fallback">
            <Image
              src="/hero-shoe.svg"
              width={700}
              height={480}
              alt="Local SOLEVA brand exhibit illustration"
            />
          </div>
        )}
      </div>
      <div className="viewer-controls">
        <span className="eyebrow">
          BRAND EXHIBIT / {valid && !useFallback ? "SPLINE" : "LOCAL R3F"}
        </span>
        <h3>
          A study
          <br />
          in possibility.
        </h3>
        <p>
          {valid && !useFallback
            ? "An externally configured Spline scene. Its licensing and runtime availability belong to the supplied asset."
            : "No licensed Spline scene is bundled. This original local React Three Fiber study fills the exhibit slot."}
        </p>
        <p className="small">
          Optional integration: set NEXT_PUBLIC_SPLINE_SCENE_URL to a genuine
          HTTPS scene you own or are licensed to use, then rebuild. No URL has
          been invented.
        </p>
        {valid && (
          <button
            className="btn btn-outline"
            onClick={() => setUseFallback(!useFallback)}
          >
            {useFallback ? "Try configured scene" : "Use local study"} ↗
          </button>
        )}
      </div>
    </div>
  );
}
