import { z } from "zod";
import { DocumentJSON } from "./document.js";

export const ProjectJSON = z.object({
  documents: z.record(DocumentJSON),
});

export type ProjectJSON = z.infer<typeof ProjectJSON>;
