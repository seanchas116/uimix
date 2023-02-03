import { ComponentNode } from "../models/ComponentNode";
import { Node } from "../models/Node";

export function createComponent(node: Node) {
  if (node.ownerComponent) {
    return;
  }

  const parent = node.parent;
  const next = node.nextSibling;

  const component = new ComponentNode();
  component.name = node.name;

  component.append([node]);

  parent?.insertBefore([component], next);
}
