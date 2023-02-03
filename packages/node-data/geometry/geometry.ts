import { z } from "zod";

export const PathVertexData = z.object({
  x: z.number(),
  y: z.number(),
  inX: z.number(),
  inY: z.number(),
  outX: z.number(),
  outY: z.number(),
});
export type PathVertexData = z.infer<typeof PathVertexData>;

export const PathLoopData = z.object({
  vertices: z.array(PathVertexData),
  closed: z.boolean(),
});
export type PathLoopData = z.infer<typeof PathLoopData>;

export const PathData = z.object({
  loops: z.array(PathLoopData),
});
export type PathData = z.infer<typeof PathData>;

export const RectData = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});
export type RectData = z.infer<typeof RectData>;
