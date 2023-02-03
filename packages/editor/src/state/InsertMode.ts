import { ImageSource } from "node-data";

export type InsertMode =
  | {
      type: "frame";
    }
  | {
      type: "text";
    }
  | {
      type: "image";
      source: ImageSource;
    };
