import { z } from "zod";

export const CodeData = z.object({
  path: z.string(),
  content: z.string(),
});
export type CodeData = z.infer<typeof CodeData>;
