import { ComponentNode } from "./ComponentNode";
import { DocumentNode } from "./DocumentNode";
import { FrameNode } from "./FrameNode";
import { GroupNode } from "./GroupNode";
import { ImageNode } from "./ImageNode";
import { InstanceNode } from "./InstanceNode";
import { ShapeNode } from "./ShapeNode";
import { StackNode } from "./StackNode";
import { TextNode } from "./TextNode";

export type Node =
  | DocumentNode
  | GroupNode
  | FrameNode
  | StackNode
  | TextNode
  | ShapeNode
  | ImageNode
  | ComponentNode
  | InstanceNode;

export function moveNodes(
  parent: Node,
  position: Node | undefined,
  nodes: readonly Node[]
): boolean {
  if (!parent.canHaveChildren) {
    return false;
  }

  const selectedNodes = new Set(nodes);

  // Do not insert to descendant
  for (const ancestor of parent.ancestors) {
    if (selectedNodes.has(ancestor)) {
      return false;
    }
  }

  // Check if node can be inserted or removed
  // for (const node of selectedNodes) {
  //   if (!parent.canInsertChild(node) || !node.canRemove()) {
  //     return false;
  //   }
  // }

  let actualPosition = position;
  while (actualPosition && selectedNodes.has(actualPosition)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    actualPosition = actualPosition.nextSibling;
  }

  parent.insertBefore([...selectedNodes], actualPosition);

  return true;
}

export const groupLikeNodeTypes: readonly Node["type"][] = [
  "group",
  "component",
];
