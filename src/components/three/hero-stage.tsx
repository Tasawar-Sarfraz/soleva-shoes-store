"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRef, useState } from "react";
import { Plus, ArrowUpRight } from "lucide-react";
import { useShopping } from "@/lib/client-store";
import { useWebGL, useReducedMotion, useVisibleScene } from "./webgl";
import { ExperienceButton } from "./experience-button";
const ShoeScene = dynamic(() => import("./shoe-scene"), {
  ssr: false,
  loading: () => null,
});
export function HeroStage() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useVisibleScene(ref);
  const webgl = useWebGL();
  const reduced = useReducedMotion();
  const preference = useShopping((s) => s.reduceEffects);
  const experience = useShopping((s) => s.experience);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className="hero-stage" ref={ref}>
      <div className="stage-label">
        <span className="eyebrow">ARC 01 / CHALK</span>
        <span className="tiny">FORM STUDY NO. 01</span>
      </div>
      <div className="stage-arch" />
      <div className="plinth" />
      <Image
        className={`hero-poster ${ready && !experience && !preference && !reduced && !failed ? "poster-hidden" : ""}`}
        src="/hero-shoe.svg"
        width={700}
        height={480}
        alt="Arc 01, an original sculptural sneaker on an architectural plinth"
        priority
      />
      {webgl && !preference && !reduced && !experience && !failed && (
        <div className="hero-canvas">
          <ShoeScene
            category="Sneakers"
            color="#e2e5d4"
            hero
            active={visible}
            onReady={() => setReady(true)}
            onFailure={() => setFailed(true)}
          />
        </div>
      )}
      <ExperienceButton
        type="shoe"
        productId="sneakers-01"
        className="material-hotspot hotspot-upper"
      >
        <Plus size={13} />
        <span>WOVEN UPPER</span>
      </ExperienceButton>
      <ExperienceButton
        type="shoe"
        productId="sneakers-01"
        className="material-hotspot hotspot-sole"
      >
        <Plus size={13} />
        <span>LAYERED SOLE</span>
      </ExperienceButton>
      <div className="stage-caption">
        <span>CONSIDERED FROM EVERY ANGLE</span>
        <ExperienceButton
          type="shoe"
          productId="sneakers-01"
          className="icon-btn"
        >
          <ArrowUpRight size={19} />
          <span className="sr-only">Open Arc 01 viewer</span>
        </ExperienceButton>
      </div>
    </div>
  );
}
