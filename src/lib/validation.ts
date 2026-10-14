import { z } from "zod";
export const cartSchema = z
  .array(
    z.object({
      sku: z.string().min(1).max(100),
      quantity: z.number().int().min(1).max(10),
    }),
  )
  .min(1)
  .max(50);
export const shippingSchema = z.object({
  recipient: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number."),
  line: z.string().trim().min(8).max(250),
  city: z.string().trim().min(2).max(100),
  postal: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9 -]{3,12}$/, "Enter a valid postal code."),
});
export const checkoutSchema = shippingSchema.extend({
  items: cartSchema,
  idempotencyKey: z.uuid(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export const productSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(120),
  category: z.enum(["Sneakers", "Running", "Casual", "Formal", "Boots"]),
  description: z.string().trim().min(10).max(2000),
  materials: z.string().trim().min(5).max(1000),
  price: z.number().int().min(100).max(100000000),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  active: z.boolean(),
  variants: z
    .array(
      z.object({
        sku: z
          .string()
          .regex(/^[a-zA-Z0-9-]+$/)
          .max(100),
        size: z.number().int().min(30).max(50),
        color: z.string().trim().min(2).max(40),
        colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        stock: z.number().int().min(0).max(100000),
      }),
    )
    .min(1)
    .max(100),
});
