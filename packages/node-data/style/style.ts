import { z } from "zod";
import { PositionConstraint } from "./value/position";
import { SizeConstraint } from "./value/size";
import { StackAlign, StackDirection, StackJustify } from "./value/stack";
import { TextHorizontalAlign, TextVerticalAlign } from "./value/text";

export const StyleJSON = z.object({
  position: z.object({
    x: PositionConstraint,
    y: PositionConstraint,
  }),
  absolute: z.boolean(),
  width: SizeConstraint,
  height: SizeConstraint,

  topLeftRadius: z.number(),
  topRightRadius: z.number(),
  bottomRightRadius: z.number(),
  bottomLeftRadius: z.number(),

  fill: z.union([z.string(), z.null()]),
  border: z.union([z.string(), z.null()]),
  borderTopWidth: z.number(),
  borderRightWidth: z.number(),
  borderBottomWidth: z.number(),
  borderLeftWidth: z.number(),

  // layout

  layout: z.enum(["none", "stack"]),
  stackDirection: StackDirection,
  stackAlign: StackAlign,
  stackJustify: StackJustify,
  gap: z.number(),
  paddingTop: z.number(),
  paddingRight: z.number(),
  paddingBottom: z.number(),
  paddingLeft: z.number(),

  // text

  textContent: z.string(),
  fontFamily: z.string(),
  fontWeight: z.number(),
  fontSize: z.number(),
  lineHeight: z.number(),
  letterSpacing: z.number(),
  textHorizontalAlign: TextHorizontalAlign,
  textVerticalAlign: TextVerticalAlign,

  // instance
  mainComponentID: z.union([z.string(), z.null()]),
});

export type StyleJSON = z.infer<typeof StyleJSON>;
