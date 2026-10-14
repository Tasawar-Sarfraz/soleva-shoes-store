export type Category = "Sneakers" | "Running" | "Casual" | "Formal" | "Boots";
export const categories: Category[] = [
  "Sneakers",
  "Running",
  "Casual",
  "Formal",
  "Boots",
];
export type Variant = {
  sku: string;
  productId: string;
  size: number;
  color: string;
  colorHex: string;
  stock: number;
};
export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  materials: string;
  price: number;
  image: string;
  model: string;
  accent: string;
  active: boolean;
  createdAt: number;
  variants: Variant[];
};
export type CartLine = { sku: string; quantity: number };
export type StoreSettings = {
  currency: string;
  language: string;
  timezone: string;
  shippingFee: number;
  freeShipping: number;
  email: string;
  phone: string;
  address: string;
  delivery: string;
  returns: string;
};
export type Quote = {
  items: {
    sku: string;
    quantity: number;
    price: number;
    name: string;
    size: number;
    color: string;
    stock: number;
    image: string;
  }[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  freeShipping: number;
};
