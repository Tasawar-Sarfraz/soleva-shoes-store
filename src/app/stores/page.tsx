import { ExperienceButton } from "@/components/three/experience-button";
import { locations } from "@/lib/locations";
export const metadata = { title: "Demonstration showrooms" };
export default function Stores() {
  return (
    <div className="section stores-page">
      <div className="page-heading">
        <span className="eyebrow">
          FICTIONAL PLACES / REAL DESIGN EXPLORATION
        </span>
        <h1>Space to find your form.</h1>
        <p>
          Three imagined showrooms. These are fictional demonstration locations.
        </p>
      </div>
      <div className="store-explorer-poster">
        <div className="poster-globe" />
        <div>
          <span className="eyebrow">THE LOCATION EXPLORER</span>
          <h2>
            A different
            <br />
            point of view.
          </h2>
          <p>
            Explore a local basic globe with selectable showroom pins.
            <br />
            No paid imagery, token, or shipment tracking.
          </p>
          <ExperienceButton type="locations" className="btn btn-dark">
            Open the globe ↗
          </ExperienceButton>
        </div>
      </div>
      <div className="store-grid">
        {locations.map((store, i) => (
          <article key={store.id}>
            <span className="eyebrow">0{i + 1} / DEMONSTRATION SHOWROOM</span>
            <h2>{store.city}</h2>
            <h3>{store.name.split(" / ")[1]}</h3>
            <p>
              {store.address}
              <br />
              {store.hours}
            </p>
            <a href={`tel:${store.phone.replaceAll(" ", "")}`}>{store.phone}</a>
            <a href={`mailto:${store.email}`}>{store.email} ↗</a>
          </article>
        ))}
      </div>
      <p className="small muted">
        Do not travel to these addresses: they are original fictional locations
        for this downloadable project.
      </p>
    </div>
  );
}
