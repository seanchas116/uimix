import { z } from "zod";

export const NodeType = z.enum([
  "root",
  "frame",
  "text",
  "component",
  "variant",
  "instance",
]);

export type NodeType = z.infer<typeof NodeType>;

export const VariantCondition = z.union([
  z.object({
    type: z.literal("hover"),
  }),
  z.object({
    type: z.literal("active"),
  }),
  z.object({
    type: z.literal("maxWidth"),
    value: z.number(),
  }),
]);

export type VariantCondition = z.infer<typeof VariantCondition>;

const NodeJSONWithoutChildren = z.object({
  id: z.string().optional(),
  type: NodeType,
  name: z.string().optional(),
  condition: VariantCondition.optional(),
});

export type NodeJSON = z.infer<typeof NodeJSONWithoutChildren> & {
  children?: NodeJSON[];
};

export const NodeJSON: z.ZodType<NodeJSON> = NodeJSONWithoutChildren.extend({
  children: z.lazy(() => z.array(NodeJSON).optional()),
});
