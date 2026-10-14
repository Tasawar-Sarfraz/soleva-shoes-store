import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  ArrowRight,
  MoveUpRight,
  Plus,
} from "lucide-react";
import { getProducts, getSettings } from "@/server/store";
import { ProductCard } from "@/components/product-card";
import { HeroStage } from "@/components/three/hero-stage";
import { ExperienceButton } from "@/components/three/experience-button";
import { categories } from "@/lib/types";
export default function Home() {
  const all = getProducts();
  const config = getSettings();
  const featured = [all[0], all[31], all[56], all[76]].filter(Boolean);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="lime-square" /> THE MOTION ATELIER — VOL. 01
          </div>
          <h1>
            Move beyond
            <br />
            <span>ordinary.</span>
          </h1>
          <p>
            Footwear for the way you move.
            <br />A study in form, texture, and everyday possibility.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-dark" href="/shop">
              Shop the collection <ArrowUpRight size={18} />
            </Link>
            <ExperienceButton
              type="shoe"
              productId="sneakers-01"
              className="text-btn"
            >
              Explore the design <Plus size={16} />
            </ExperienceButton>
          </div>
          <div className="hero-foot">
            <span>01 — ARC SERIES</span>
            <span>
              DESIGNED TO MOVE YOU <ArrowDown size={12} />
            </span>
          </div>
        </div>
        <HeroStage />
      </section>
      <div className="collection-strip">
        <span className="eyebrow">FIND YOUR FORM</span>
        {categories.map((category, i) => (
          <Link key={category} href={`/shop?category=${category}`}>
            <span className="tiny">0{i + 1}</span>
            {category}
            <ArrowUpRight size={15} />
          </Link>
        ))}
      </div>
      <section className="section featured">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE EDIT / 001</span>
            <h2>
              A new perspective
              <br />
              on your everyday.
            </h2>
          </div>
          <div>
            <p>
              Distinct silhouettes. Considered details.
              <br />
              Meet a few pieces from the collection.
            </p>
            <Link className="text-btn" href="/shop">
              Explore all 100 designs <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={config.currency}
              index={i}
            />
          ))}
        </div>
      </section>
      <section className="anatomy-section">
        <div className="anatomy-image">
          <div className="eyebrow">FORM FOLLOWS MOVEMENT</div>
          <div className="anatomy-parts">
            <span className="part upper-part">01 / WOVEN UPPER</span>
            <span className="part laces-part">02 / LACE SYSTEM</span>
            <span className="part sole-part">03 / LAYERED SOLE</span>
            <Image
              src="/hero-shoe.svg"
              width="700"
              height="480"
              alt="Original Arc sneaker illustration, with labelled construction layers"
            />
          </div>
          <span className="tiny">
            ILLUSTRATIVE CONSTRUCTION / ORIGINAL PROCEDURAL MODEL
          </span>
        </div>
        <div className="anatomy-copy">
          <span className="eyebrow">INSIDE THE DESIGN</span>
          <h2>
            Every layer.
            <br />A little more
            <br />
            <em>considered.</em>
          </h2>
          <p>
            From the woven upper to the grounded outsole, explore how separate
            elements come together. Open the design viewer to take the
            silhouette apart.
          </p>
          <ExperienceButton
            type="shoe"
            productId="sneakers-01"
            className="btn btn-dark"
          >
            Explore the anatomy <MoveUpRight size={18} />
          </ExperienceButton>
          <Link className="text-btn" href="/atelier">
            Visit the Sole Lab <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section className="section story-section">
        <div>
          <span className="eyebrow">A NOTE FROM THE ATELIER</span>
          <h2>
            Good design starts
            <br />
            with a closer look.
          </h2>
        </div>
        <div>
          <p>
            SOLEVA is a fictional footwear atelier exploring the space between
            sculptural form and daily use. We care about the details you notice,
            and the ones you only feel.
          </p>
          <p>
            Our catalogue uses original illustrations and reusable procedural
            models. It is a design and shopping demonstration, with no claims of
            tested athletic performance.
          </p>
          <Link href="/atelier" className="text-btn">
            Our approach <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      <section className="visit-banner">
        <span className="eyebrow">THE NEXT MOVE IS YOURS</span>
        <h2>Find your everyday extraordinary.</h2>
        <Link className="btn btn-lime" href="/shop">
          Discover the collection <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}
