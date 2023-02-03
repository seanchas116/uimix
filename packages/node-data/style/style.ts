import { z } from "zod";
import { PositionConstraint } from "./value/position";
import { SizeConstraint } from "./value/size";
import { StackAlign, StackDirection, StackJustify } from "./value/stack";
import { TextHorizontalAlign, TextVerticalAlign } from "./value/text";

export const CommonStyleMixin = z.object({
  x: PositionConstraint,
  y: PositionConstraint,
  width: SizeConstraint,
  height: SizeConstraint,
  fill: z.union([z.string(), z.null()]),
  border: z.union([z.string(), z.null()]),
  borderTopWidth: z.number(),
  borderRightWidth: z.number(),
  borderBottomWidth: z.number(),
  borderLeftWidth: z.number(),
});
export type CommonStyleMixin = z.infer<typeof CommonStyleMixin>;

export const FrameStyleMixin = z.object({
  topLeftRadius: z.number(),
  topRightRadius: z.number(),
  bottomRightRadius: z.number(),
  bottomLeftRadius: z.number(),
});
export const FrameStyleData = CommonStyleMixin.merge(FrameStyleMixin);
export type FrameStyleData = z.infer<typeof FrameStyleData>;

export const StackStyleMixin = z.object({
  stackDirection: StackDirection,
  stackAlign: StackAlign,
  stackJustify: StackJustify,
  gap: z.number(),
  paddingTop: z.number(),
  paddingRight: z.number(),
  paddingBottom: z.number(),
  paddingLeft: z.number(),
});
export const StackStyleData =
  CommonStyleMixin.merge(FrameStyleMixin).merge(StackStyleMixin);
export type StackStyleData = z.infer<typeof StackStyleData>;

export const TextStyleMixin = z.object({
  fontFamily: z.string(),
  fontWeight: z.number(),
  fontSize: z.number(),
  lineHeight: z.number(),
  letterSpacing: z.number(),
  textHorizontalAlign: TextHorizontalAlign,
  textVerticalAlign: TextVerticalAlign,
});
export const TextStyleData = CommonStyleMixin.merge(TextStyleMixin);
export type TextStyleData = z.infer<typeof TextStyleData>;

export const ShapeStyleData = CommonStyleMixin;
export type ShapeStyleData = z.infer<typeof ShapeStyleData>;

export const AllStyleData = CommonStyleMixin.merge(FrameStyleMixin)
  .merge(StackStyleMixin)
  .merge(TextStyleMixin);
export type AllStyleData = z.infer<typeof AllStyleData>;
