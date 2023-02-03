import { compact } from "lodash-es";
import { Vec2 } from "paintvec";
import { Selectable } from "../../../models/Selectable";
import { projectState } from "../../../state/ProjectState";
import { scrollState } from "../../../state/ScrollState";
import { assertNonNull } from "../../../utils/Assert";
import { selectableForDOM } from "./NodeRenderer";

function clickableAncestor(
  instanceAtPos: Selectable,
  type: "click" | "doubleClick"
): Selectable {
  const clickables = new Set<Selectable>();

  for (const selected of projectState.selectedSelectables) {
    for (const descendantSelected of selected.ancestors) {
      const siblings = descendantSelected.parent?.children ?? [];
      for (const sibling of siblings) {
        clickables.add(sibling);
      }
    }
  }

  let instance = instanceAtPos;
  let innerInstance = instanceAtPos;

  while (2 < instance.ancestors.length && !clickables.has(instance)) {
    innerInstance = instance;
    instance = assertNonNull(instance.parent);
  }

  if (type === "doubleClick") {
    return innerInstance;
  }

  return instance;
}

export class NodePicker {
  private instancesFromPoint(clientX: number, clientY: number): Selectable[] {
    const doms = document.elementsFromPoint(clientX, clientY);
    return [
      ...compact(doms.map((dom) => selectableForDOM.get(dom as HTMLElement))),
    ];
  }

  pick(
    event: MouseEvent | DragEvent,
    mode: "click" | "doubleClick" = "click"
  ): NodePickResult {
    return new NodePickResult(
      this.instancesFromPoint(event.clientX, event.clientY),
      scrollState.documentPosForEvent(event),
      event,
      mode
    );
  }
}

export class NodePickResult {
  constructor(
    all: readonly Selectable[],
    pos: Vec2,
    event: MouseEvent | DragEvent,
    mode: "click" | "doubleClick"
  ) {
    this.all = all;
    this.pos = pos;
    this.event = event;
    this.mode = mode;
  }

  readonly all: readonly Selectable[];
  readonly pos: Vec2;
  readonly event: MouseEvent | DragEvent;
  readonly mode: "click" | "doubleClick";

  get clickable(): Selectable | undefined {
    const instance = this.all[0];
    if (instance) {
      return clickableAncestor(instance, "click");
    }
  }

  get doubleClickable(): Selectable | undefined {
    const instance = this.all[0];
    if (instance) {
      return clickableAncestor(instance, "doubleClick");
    }
  }

  get default(): Selectable | undefined {
    if (this.mode === "doubleClick") {
      return this.doubleClickable;
    }

    return this.event.metaKey || this.event.ctrlKey
      ? this.all[0]
      : this.clickable;
  }
}

export const nodePicker = new NodePicker();
