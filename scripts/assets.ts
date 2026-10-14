import {
  mkdirSync,
  writeFileSync,
  cpSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { sampleCatalogue } from "../src/lib/catalogue";
import { shoeArtwork } from "../src/lib/artwork";
mkdirSync("public/products", { recursive: true });
for (const product of sampleCatalogue()) {
  writeFileSync(
    `public/products/${product.id}.svg`,
    shoeArtwork(product.category, product.accent),
  );
  for (const [index, color] of [
    ...new Map(product.variants.map((v) => [v.color, v.colorHex])).values(),
  ].entries()) {
    writeFileSync(
      `public/products/${product.id}-${index}.svg`,
      shoeArtwork(product.category, color),
    );
  }
}
for (const category of ["Sneakers", "Running", "Casual", "Formal", "Boots"]) {
  writeFileSync(
    `public/products/${category.toLowerCase()}-generic.svg`,
    shoeArtwork(category),
  );
}
writeFileSync("public/hero-shoe.svg", shoeArtwork("Sneakers", "#d8decb"));
writeFileSync(
  "public/hero-shoe-alt.svg",
  shoeArtwork("Sneakers", "#d8decb", true),
);
mkdirSync("public/fonts", { recursive: true });
const fontDir = "node_modules/@fontsource-variable/dm-sans/files";
const font = readdirSync(fontDir).find(
  (name) => name === "dm-sans-latin-wght-normal.woff2",
);
if (!font) throw new Error("Local DM Sans font missing. Run npm ci.");
cpSync(join(fontDir, font), "public/fonts/dm-sans.woff2");
cpSync(
  "node_modules/@fontsource/dm-serif-display/files/dm-serif-display-latin-400-italic.woff2",
  "public/fonts/dm-serif-display-italic.woff2",
);
mkdirSync("public/licenses", { recursive: true });
cpSync(
  "node_modules/@fontsource/dm-serif-display/LICENSE",
  "public/licenses/DM-Serif-Display-OFL.txt",
);
cpSync(
  "node_modules/@fontsource-variable/dm-sans/LICENSE",
  "public/licenses/DM-Sans-OFL.txt",
);
cpSync("node_modules/aframe/LICENSE", "public/licenses/A-Frame-MIT.txt");
cpSync(
  "node_modules/cesium/LICENSE.md",
  "public/licenses/Cesium-Apache-2.0.txt",
);
mkdirSync("public/vendor", { recursive: true });
cpSync(
  "node_modules/aframe/dist/aframe-master.min.js",
  "public/vendor/aframe.min.js",
);
for (const name of ["Workers", "Assets", "Widgets", "ThirdParty"]) {
  const source = `node_modules/cesium/Build/Cesium/${name}`;
  if (!existsSync(source)) throw new Error(`Cesium asset missing: ${source}`);
  cpSync(source, `public/cesium/${name}`, { recursive: true });
}
console.log(
  "Local artwork, font, A-Frame runtime, and Cesium assets prepared.",
);
