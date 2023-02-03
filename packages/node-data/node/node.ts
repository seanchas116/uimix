import {
  AllStyleData,
  FrameStyleData,
  ShapeStyleData,
  StackStyleData,
  TextStyleData,
} from "../style/style";
import {
  Property,
  PropReference,
  VariantData,
  PageData,
} from "../component/component";
import { PathData, RectData } from "../geometry/geometry";
import { z } from "zod";

function nodeStyleProps<T extends z.AnyZodObject>(schema: T) {
  return {
    style: schema,
    styleForVariant: z.record(schema.partial()),
  } as const;
}

const nodeBaseProps = {
  id: z.string(),
  parent: z.string().optional(),
  index: z.number(),
  name: z.string(),
} as const;

export const NodeBaseData = z.object(nodeBaseProps);
export type NodeBaseData = z.infer<typeof NodeBaseData>;

export const GroupNodeData = z.object({
  type: z.literal("group"),
  ...nodeBaseProps,
});
export type GroupNodeData = z.infer<typeof GroupNodeData>;

// Equivalent to Figma's frame node
// (all children are absolute positioned)
export const FrameNodeData = z.object({
  type: z.literal("frame"),
  ...nodeBaseProps,
  ...nodeStyleProps(FrameStyleData),
});
export type FrameNodeData = z.infer<typeof FrameNodeData>;

// Equivalent to Figma's auto layout node
// (horizontal or vertical flexbox)
export const StackNodeData = z.object({
  type: z.literal("stack"),
  ...nodeBaseProps,
  ...nodeStyleProps(StackStyleData),
});
export type StackNodeData = z.infer<typeof StackNodeData>;

export const TextNodeData = z.object({
  type: z.literal("text"),
  ...nodeBaseProps,
  ...nodeStyleProps(TextStyleData),
  content: z.union([z.string(), PropReference]),
});
export type TextNodeData = z.infer<typeof TextNodeData>;

export const ShapeNodeData = z.object({
  type: z.literal("shape"),
  ...nodeBaseProps,
  ...nodeStyleProps(ShapeStyleData),
  path: PathData,
  viewBox: RectData,
});
export type ShapeNodeData = z.infer<typeof ShapeNodeData>;

export const ImageSource = z.object({
  dataURL: z.string(),
  width: z.number(),
  height: z.number(),
});
export type ImageSource = z.infer<typeof ImageSource>;

export const ImageNodeData = z.object({
  type: z.literal("image"),
  ...nodeBaseProps,
  ...nodeStyleProps(ShapeStyleData),
  source: ImageSource,
});
export type ImageNodeData = z.infer<typeof ImageNodeData>;

export const ComponentNodeData = z.object({
  type: z.literal("component"),
  ...nodeBaseProps,
  props: z.array(Property).optional(),
  code: z.string().optional(),
  variants: z.array(VariantData).optional(),
  page: PageData.optional(),
});
export type ComponentNodeData = z.infer<typeof ComponentNodeData>;

export const InstanceNodeData = z.object({
  type: z.literal("instance"),
  ...nodeBaseProps,
  ...nodeStyleProps(AllStyleData.partial()),
  componentID: z.string(),
});
export type InstanceNodeData = z.infer<typeof InstanceNodeData>;

export const NodeData = z.union([
  GroupNodeData,
  FrameNodeData,
  StackNodeData,
  TextNodeData,
  ImageNodeData,
  ShapeNodeData,
  ComponentNodeData,
  InstanceNodeData,
]);
export type NodeData = z.infer<typeof NodeData>;

export interface NodeHierarchyData {
  node: NodeData;
  children: NodeHierarchyData[];
}

export const NodeHierarchyData: z.ZodType<NodeHierarchyData> = z.lazy(() =>
  z.object({
    node: NodeData,
    children: z.array(NodeHierarchyData),
  })
);

// { [node id]: node data }
export const NodeChanges = z.record(NodeData.or(z.null()));
export type NodeChanges = z.infer<typeof NodeChanges>;

// { [document id]: { [node id]: node data } }
export const NodeChangesForDocument = z.record(NodeChanges);
export type NodeChangesForDocument = z.infer<typeof NodeChangesForDocument>;
