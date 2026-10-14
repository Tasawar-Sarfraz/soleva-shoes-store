import { Box, Layers, Scan, Globe, ArrowUpRight } from "lucide-react";
import { ExperienceButton } from "@/components/three/experience-button";
export const metadata = { title: "The Motion Atelier" };
const exhibits = [
  {
    type: "shoe" as const,
    title: "The anatomy of movement",
    tag: "01 / THREE.JS + R3F",
    text: "Orbit a category model, separate its layers, and experiment with a clearly labelled monogram preview.",
    icon: Box,
  },
  {
    type: "lab" as const,
    title: "A grounded perspective",
    tag: "02 / BABYLON.JS SOLE LAB",
    text: "Explore an illustrative three-layer sole cross-section and a simple visual flex slider. No performance claims.",
    icon: Layers,
  },
  {
    type: "showroom" as const,
    title: "An imagined exhibition",
    tag: "03 / A-FRAME SHOWROOM",
    text: "Walk through a small virtual gallery. Mouse, touch and keyboard work alongside optional, explicitly activated WebXR.",
    icon: Scan,
  },
  {
    type: "brand" as const,
    title: "Form, in a different light",
    tag: "04 / OPTIONAL SPLINE SLOT",
    text: "An original local R3F brand study. A genuine licensed Spline scene can be configured later; none is claimed or bundled.",
    icon: Globe,
  },
];
export default function Atelier() {
  return (
    <div className="section atelier-page">
      <div className="page-heading">
        <span className="eyebrow">A PLACE TO LOOK CLOSER</span>
        <h1>The Motion Atelier.</h1>
        <p>
          Four ways to explore the form. One considered experience at a time.
        </p>
      </div>
      <div className="atelier-intro">
        <h2>
          Details worth
          <br />
          spending time with.
        </h2>
        <p>
          Our original procedural footwear models are built from a small family
          of category silhouettes. Materials, shapes, and colour give each study
          its own character. They are illustrative models, not individually
          scanned products or tested performance prototypes.
        </p>
      </div>
      <div className="exhibit-grid">
        {exhibits.map(({ type, title, tag, text, icon: Icon }) => (
          <article className={`exhibit-card exhibit-${type}`} key={type}>
            <div className="exhibit-graphic">
              <Icon strokeWidth={0.7} />
              <span className="exhibit-number">{tag.split(" / ")[0]}</span>
            </div>
            <span className="eyebrow">{tag}</span>
            <h2>{title}</h2>
            <p>{text}</p>
            <ExperienceButton
              type={type}
              productId={type === "shoe" ? "sneakers-01" : undefined}
              className="btn btn-dark"
            >
              Open experience <ArrowUpRight size={16} />
            </ExperienceButton>
          </article>
        ))}
      </div>
    </div>
  );
}
