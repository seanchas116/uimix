import { sum } from "lodash-es";
import { StackAlign, StackNodeData } from "node-data";
import { Rect } from "paintvec";
import { FrameNode } from "../models/FrameNode";
import { Selectable } from "../models/Selectable";
import { StackNode } from "../models/StackNode";
import { assertNonNull } from "../utils/Assert";

export function removeLayout(selectable: Selectable): Selectable {
  if (selectable.node.type !== "stack") {
    return selectable;
  }

  const original = selectable.node;
  const parent = original.parent;
  const next = original.nextSibling;
  const data = original.serialize();
  const width = selectable.computedRect.width;
  const height = selectable.computedRect.height;

  for (const child of selectable.children) {
    child.style.position = {
      x: {
        type: "start",
        start: child.offsetComputedRect.left,
      },
      y: {
        type: "start",
        start: child.offsetComputedRect.top,
      },
    };
  }

  const frameNode = new FrameNode();
  frameNode.append(original.children);
  frameNode.deserialize({ ...data, type: "frame" });
  const frameSelectable = Selectable.get(frameNode);
  frameSelectable.style.width = { type: "fixed", value: width };
  frameSelectable.style.height = { type: "fixed", value: height };

  parent?.insertBefore([frameNode], next);
  original.remove();

  return frameSelectable;
}

export function autoLayout(selectable: Selectable): Selectable {
  if (selectable.node.type !== "frame") {
    return selectable;
  }

  const original = selectable.node;
  const parent = original.parent;
  const next = original.nextSibling;

  const width = selectable.computedRect.width;
  const height = selectable.computedRect.height;

  const flex = detectFlex(selectable.children);

  const offsetBBox = flex.bbox.translate(selectable.computedRect.topLeft.neg);

  const data = original.serialize();

  const stackNode = new StackNode();
  stackNode.deserialize({ ...data, type: "stack" } as StackNodeData);

  const stackSelectable = Selectable.get(stackNode);
  stackSelectable.style.stackDirection = flex.direction;
  stackSelectable.style.stackAlign = flex.align;
  stackSelectable.style.gap = flex.gap;
  stackSelectable.style.paddingLeft = Math.max(0, offsetBBox.left);
  stackSelectable.style.paddingTop = Math.max(0, offsetBBox.top);
  stackSelectable.style.paddingRight = Math.max(0, width - offsetBBox.right);
  stackSelectable.style.paddingBottom = Math.max(0, height - offsetBBox.bottom);

  stackNode.append(flex.elements.map((e) => e.node));
  parent?.insertBefore([stackNode], next);
  original.remove();

  return stackSelectable;
}

export function detectFlex(elements: readonly Selectable[]): {
  elements: readonly Selectable[];
  bbox: Rect;
  direction: "x" | "y";
  gap: number;
  align: StackAlign;
} {
  if (!elements.length) {
    return {
      elements,
      bbox: new Rect(),
      direction: "x",
      gap: 0,
      align: "start",
    };
  }
  if (elements.length === 1) {
    return {
      elements,
      bbox: elements[0].computedRect,
      direction: "x",
      gap: 0,
      align: "start",
    };
  }

  const topSorted = elements.slice();
  topSorted.sort((a, b) => a.computedRect.top - b.computedRect.top);
  const leftSorted = elements.slice();
  leftSorted.sort((a, b) => a.computedRect.left - b.computedRect.left);
  const bbox = assertNonNull(
    Rect.union(...elements.map((o) => o.computedRect))
  );

  const xGaps: number[] = [];
  const yGaps: number[] = [];

  for (let i = 1; i < elements.length; ++i) {
    xGaps.push(
      leftSorted[i].computedRect.left - leftSorted[i - 1].computedRect.right
    );
    yGaps.push(
      topSorted[i].computedRect.top - topSorted[i - 1].computedRect.bottom
    );
  }

  const direction = sum(yGaps) < sum(xGaps) ? "x" : "y";

  if (direction === "x") {
    const startError = sum(elements.map((o) => o.computedRect.top - bbox.top));
    const centerError = sum(
      elements.map((o) => Math.abs(o.computedRect.center.y - bbox.center.y))
    );
    const endError = sum(
      elements.map((o) => bbox.bottom - o.computedRect.bottom)
    );
    const align =
      (startError === 0 && endError === 0) ||
      (startError < centerError && startError < endError)
        ? "start"
        : centerError < endError
        ? "center"
        : "end";

    return {
      elements: leftSorted,
      bbox,
      direction: "x",
      gap: Math.max(Math.round(sum(xGaps) / xGaps.length), 0),
      align,
    };
  } else {
    const startError = sum(
      elements.map((o) => o.computedRect.left - bbox.left)
    );
    const centerError = sum(
      elements.map((o) => Math.abs(o.computedRect.center.x - bbox.center.x))
    );
    const endError = sum(
      elements.map((o) => bbox.right - o.computedRect.right)
    );
    const align =
      (startError === 0 && endError === 0) ||
      (startError < centerError && startError < endError)
        ? "start"
        : centerError < endError
        ? "center"
        : "end";

    return {
      elements: topSorted,
      bbox,
      direction: "y",
      gap: Math.max(Math.round(sum(yGaps) / yGaps.length), 0),
      align,
    };
  }
}
