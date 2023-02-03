import { NodeHierarchyData } from "node-data";
import { z } from "zod";

const mimeType = "application/x-macaron-nodes";

export class Clipboard {
  static async writeNodes(nodes: readonly NodeHierarchyData[]) {
    const json = JSON.stringify(nodes);

    await navigator.clipboard.write([
      new ClipboardItem({
        [`web ${mimeType}`]: new Blob([json], {
          type: mimeType,
        }),
      }),
    ]);
  }

  static async readNodes(): Promise<NodeHierarchyData[]> {
    const items = await navigator.clipboard.read();
    const item = items.find((item) => item.types.includes(`web ${mimeType}`));
    if (!item) {
      return [];
    }
    const blob = await item.getType(`web ${mimeType}`);
    const json: unknown = JSON.parse(await blob.text());
    return z.array(NodeHierarchyData).parse(json);
  }
}
