import type { Product, StoreSettings } from "./types";
export const defaultSettings: StoreSettings = {
  currency: "PKR",
  language: "en-PK",
  timezone: "Asia/Karachi",
  shippingFee: 35000,
  freeShipping: 1500000,
  email: "hello@soleva.example",
  phone: "+92 300 0000000",
  address: "12 Atelier Lane, Karachi — fictional demonstration address",
  delivery:
    "Demonstration delivery estimate: 3–5 working days within Pakistan. Cash on delivery. No actual fulfilment is connected.",
  returns:
    "Demonstration policy: request a return within 14 days for unworn shoes in their original packaging. Use the contact form; no automated return shipping is connected.",
};
const groups = [
  {
    category: "Sneakers",
    count: 30,
    names: ["Arc", "Orbit", "Frame", "Flux", "Axis", "Contour"],
    price: 1180000,
    colors: ["Chalk", "Graphite"],
    hex: ["#e8e3d4", "#383a35"],
    materials:
      "Woven textile upper, synthetic overlays, foam midsole and rubber outsole.",
  },
  {
    category: "Running",
    count: 25,
    names: ["Pace", "Stride", "Tempo", "Kinetic", "Circuit"],
    price: 1320000,
    colors: ["Mist", "Lime"],
    hex: ["#bdc9c7", "#c8ed70"],
    materials:
      "Open-weave textile upper, soft foam midsole and segmented rubber outsole. This sample design has no validated performance claims.",
  },
  {
    category: "Casual",
    count: 20,
    names: ["Daybreak", "Still", "Studio", "Ease"],
    price: 820000,
    colors: ["Sand", "Clay"],
    hex: ["#d5c4ac", "#a5735d"],
    materials: "Canvas upper, textile lining and moulded rubber cupsole.",
  },
  {
    category: "Formal",
    count: 15,
    names: ["Ledger", "Edition", "Chapter"],
    price: 1490000,
    colors: ["Espresso", "Black"],
    hex: ["#664839", "#292824"],
    materials:
      "Illustrative leather-look upper, textile lining and stacked rubber heel. Material is synthetic in this fictional catalogue.",
  },
  {
    category: "Boots",
    count: 10,
    names: ["Terrain", "Summit"],
    price: 1790000,
    colors: ["Umber", "Slate"],
    hex: ["#91754f", "#666f72"],
    materials:
      "Synthetic leather-look high upper, padded textile collar and lugged rubber sole.",
  },
];
export function sampleCatalogue(): Product[] {
  return groups.flatMap((group) =>
    Array.from({ length: group.count }, (_, i) => {
      const n = String(i + 1).padStart(2, "0");
      const id = `${group.category.toLowerCase()}-${n}`;
      const name = `${group.names[i % group.names.length]} ${n}`;
      return {
        id,
        slug: `${name.toLowerCase().replaceAll(" ", "-")}-${group.category.toLowerCase()}`,
        name,
        category: group.category,
        description: `${name} explores ${group.category === "Formal" ? "a precise, understated silhouette for dressed-up days" : group.category === "Boots" ? "structured proportions and a grounded profile" : "layered textures and fluid lines for everyday movement"}. Designed for the SOLEVA demonstration collection.`,
        materials: group.materials,
        price: group.price + i * 12500,
        image: `/products/${id}.svg`,
        model: group.category.toLowerCase(),
        accent: group.hex[0],
        active: true,
        createdAt: 1750000000000 + i,
        variants: group.colors.flatMap((color, c) =>
          [39, 40, 41, 42, 43, 44].map((size) => ({
            sku: `${id}-${size}-${c}`,
            productId: id,
            size,
            color,
            colorHex: group.hex[c],
            stock:
              i === group.count - 1 || (size === 39 && (i + c) % 4 === 0)
                ? 0
                : 3 + ((i + size + c) % 9),
          })),
        ),
      };
    }),
  );
}
