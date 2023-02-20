import { Selectable } from "../models/Selectable";
import { projectState } from "../state/ProjectState";

export function createComponent(selectable: Selectable) {
  if (selectable.idPath.length > 1) {
    return;
  }
  if (selectable.ancestors.some((a) => a.node.type === "component")) {
    return;
  }

  const component = projectState.project.nodes.create("component");
  component.name = selectable.node.name;
  component.append([selectable.node]);
  projectState.page.append([component]);
}
