"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useShopping } from "@/lib/client-store";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";
const loading = () => (
  <div className="experience-loading" role="status">
    Preparing your design experience…
  </div>
);
const ShoeViewer = dynamic(() => import("./shoe-viewer"), {
  ssr: false,
  loading,
});
const BabylonLab = dynamic(() => import("./babylon-lab"), {
  ssr: false,
  loading,
});
const Aframe = dynamic(() => import("./aframe-showroom"), {
  ssr: false,
  loading,
});
const Cesium = dynamic(() => import("./cesium-loader"), {
  ssr: false,
  loading,
});
const Spline = dynamic(() => import("./spline-exhibit"), {
  ssr: false,
  loading,
});
const titles = {
  shoe: "Design viewer",
  lab: "Sole Lab",
  showroom: "Virtual showroom",
  locations: "Store explorer",
  brand: "Brand exhibit",
};
export function ExperienceHub() {
  const experience = useShopping((s) => s.experience);
  const close = useShopping((s) => s.close);
  const reduce = useShopping((s) => s.reduceEffects);
  const setReduce = useShopping((s) => s.setReduceEffects);
  const quality = useShopping((s) => s.quality);
  const setQuality = useShopping((s) => s.setQuality);
  const dialog = useRef<HTMLDialogElement>(null);
  const path = usePathname();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  useEffect(() => () => close(), [path, close]);
  useEffect(() => {
    if (experience && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [experience]);
  useEffect(() => {
    if (experience?.type !== "shoe") return;
    let active = true;
    api<Product[]>("products")
      .then((all) => {
        if (active) {
          setError("");
          const selected = experience.productId
            ? all.find((p) => p.id === experience.productId)
            : all[0];
          if (!selected) {
            setError("This design is no longer available.");
            return;
          }
          setProduct(selected);
        }
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      });
    return () => {
      active = false;
    };
  }, [experience]);
  if (!experience) return null;
  return (
    <dialog
      ref={dialog}
      className="experience-dialog"
      aria-labelledby="experience-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="experience-header">
        <div>
          <span className="eyebrow">THE MOTION ATELIER</span>
          <h2 id="experience-title">{titles[experience.type]}</h2>
        </div>
        <div className="experience-preferences">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={reduce}
              onChange={(e) => setReduce(e.target.checked)}
            />{" "}
            Reduce effects
          </label>
          <label>
            <span className="sr-only">Render quality</span>
            <select
              aria-label="Render quality"
              value={quality}
              onChange={(e) => setQuality(e.target.value as "low" | "high")}
            >
              <option value="low">Balanced quality</option>
              <option value="high">Higher quality</option>
            </select>
          </label>
          <button
            className="icon-btn"
            aria-label="Close experience"
            onClick={close}
          >
            <X />
          </button>
        </div>
      </div>
      {experience.type === "shoe" ? (
        error ? (
          <p role="alert" className="error-box">
            {error}
          </p>
        ) : product &&
          (!experience.productId || product.id === experience.productId) ? (
          <ShoeViewer key={experience.productId} product={product} />
        ) : (
          loading()
        )
      ) : experience.type === "lab" ? (
        <BabylonLab />
      ) : experience.type === "showroom" ? (
        <Aframe />
      ) : experience.type === "locations" ? (
        <Cesium />
      ) : (
        <Spline />
      )}
    </dialog>
  );
}
