import { NodeJSON } from "@uimix/node-data";
import { IStyle } from "../models/Style";
import { generateID } from "../utils/ID";

const mimeType = "application/x-macaron-nodes";

interface NodeClipboardData {
  nodes: Record<string, NodeJSON>;
  styles: Record<string, Partial<IStyle>>;
}

function reassignNewIDs(data: NodeClipboardData): NodeClipboardData {
  const idMap = new Map<string, string>();

  const newNodes: Record<string, NodeJSON> = {};
  for (const [id, node] of Object.entries(data.nodes)) {
    const newID = generateID();
    idMap.set(id, newID);
    newNodes[newID] = { ...node };
  }

  for (const node of Object.values(newNodes)) {
    if (node.parent) {
      node.parent = idMap.get(node.parent) ?? node.parent;
    }
  }

  const newStyles: Record<string, Partial<IStyle>> = {};
  for (const [id, style] of Object.entries(data.styles)) {
    const idPath = id.split(":").map((id) => idMap.get(id) ?? id);
    newStyles[idPath.join(":")] = style;
  }

  return {
    nodes: newNodes,
    styles: newStyles,
  };
}

export class Clipboard {
  static async writeNodes(nodes: NodeClipboardData) {
    const json = JSON.stringify(nodes);

    await navigator.clipboard.write([
      new ClipboardItem({
        [`web ${mimeType}`]: new Blob([json], {
          type: mimeType,
        }),
      }),
    ]);
  }

  static async readNodes(): Promise<NodeClipboardData> {
    const items = await navigator.clipboard.read();
    const item = items.find((item) => item.types.includes(`web ${mimeType}`));
    if (!item) {
      return {
        nodes: {},
        styles: {},
      };
    }
    const blob = await item.getType(`web ${mimeType}`);
    const json: unknown = JSON.parse(await blob.text());
    return reassignNewIDs(json as NodeClipboardData); // TODO: validate
  }
}
