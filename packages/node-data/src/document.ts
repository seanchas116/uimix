import { z } from "zod";
import { NodeJSON } from "./node/node.js";
import { StyleJSON } from "./style/style.js";

export const DocumentJSON = z.object({
  // TODO: version
  nodes: z.array(NodeJSON),
  styles: z.record(StyleJSON.partial()),
});

export type DocumentJSON = z.infer<typeof DocumentJSON>;
