import { z } from "zod";

export const VariantInteractionType = z.enum([
  "hover",
  "focus",
  "active",
  "checked",
  "disabled",
]);
export type VariantInteractionType = z.infer<typeof VariantInteractionType>;

export const VariantCondition = z.union([
  z.object({
    type: z.literal("interaction"),
    value: VariantInteractionType,
  }),
  z.object({
    type: z.literal("maxWidth"),
    value: z.number(),
  }),
]);
export type VariantCondition = z.infer<typeof VariantCondition>;

export const VariantData = z.object({
  id: z.string(),
  condition: VariantCondition,
});
export type VariantData = z.infer<typeof VariantData>;

export const PropertyType = z.enum(["string", "number", "boolean"]);
export type PropertyType = z.infer<typeof PropertyType>;

export const Property = z.object({
  name: z.string(),
  type: PropertyType,
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
});
export type Property = z.infer<typeof Property>;

export const PropReference = z.object({
  type: z.literal("prop"),
  name: z.string(),
});
export type PropReference = z.infer<typeof PropReference>;

export const PageData = z.object({
  path: z.string(), // example: "/about" or "/posts/:id"
  // TODO: OGP metadata
});
export type PageData = z.infer<typeof PageData>;
