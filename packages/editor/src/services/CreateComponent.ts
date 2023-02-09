import { Selectable } from "../models/Selectable";
import { projectState } from "../state/ProjectState";

export function createComponent(selectable: Selectable) {
  if (selectable.idPath.length > 1) {
    return;
  }
  if (selectable.ancestors.some((a) => a.node.type === "component")) {
    return;
  }

  const [component] = projectState.document.root.append([
    {
      type: "component",
      name: selectable.node.name,
    },
  ]);

  const json = selectable.node.toJSON();
  selectable.node.remove();
  component.append([json]);
}
