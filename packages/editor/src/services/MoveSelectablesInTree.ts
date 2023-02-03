import { moveNodes } from "../models/Node";
import { Selectable } from "../models/Selectable";

export function moveSelectablesInTree(
  parent: Selectable,
  next: Selectable | undefined,
  selectables: readonly Selectable[]
) {
  if (parent.node.type === "component") {
    // cannot move nodes into a component
    return;
  }

  // Move nodes
  // TODO: adjust positions

  moveNodes(
    parent.node,
    next?.node,
    selectables.map((selectable) => selectable.node)
  );
}
