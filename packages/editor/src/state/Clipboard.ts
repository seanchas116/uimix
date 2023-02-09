import { cloneDeep } from "lodash-es";
import { NodeJSON } from "../models/Node";
import { IStyle } from "../models/Style";
import { generateID } from "../utils/ID";

const mimeType = "application/x-macaron-nodes";

interface NodeClipboardData {
  nodes: NodeJSON[];
  styles: Record<string, Partial<IStyle>>;
}

function reassignNewIDs(data: NodeClipboardData): NodeClipboardData {
  const idMap = new Map<string, string>();

  const newNodes = cloneDeep(data.nodes);

  const generateRecursive = (node: NodeJSON) => {
    const oldID = node.id;
    const newID = generateID();
    if (oldID) {
      idMap.set(oldID, newID);
    }
    node.id = newID;

    for (const child of node.children ?? []) {
      generateRecursive(child);
    }
  };
  for (const node of newNodes) {
    generateRecursive(node);
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
        nodes: [],
        styles: {},
      };
    }
    const blob = await item.getType(`web ${mimeType}`);
    const json: unknown = JSON.parse(await blob.text());
    return reassignNewIDs(json as NodeClipboardData); // TODO: validate
  }
}
