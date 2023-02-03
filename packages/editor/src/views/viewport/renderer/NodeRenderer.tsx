import { observer } from "mobx-react-lite";
import { StackDirection } from "node-data";
import React, { createRef, useEffect } from "react";
import { Selectable } from "../../../models/Selectable";
import { buildNodeCSS } from "./buildNodeCSS";
import { InstanceRenderer } from "./InstanceRenderer";
import { ComputedRectProvider } from "./ComputedRectProvider";

export const selectableForDOM = new WeakMap<HTMLElement, Selectable>();

class ComputedRectUpdater {
  private dirtyTopLevels = new Set<Selectable>();

  add(selectable: Selectable) {
    this.dirtyTopLevels.add(selectable.ancestors[1]);
  }

  flush() {
    for (const topLevel of this.dirtyTopLevels) {
      const markDirtyRecursive = (selectable: Selectable) => {
        const computedRectProvider = selectable.computedRectProvider;
        if (computedRectProvider instanceof ComputedRectProvider) {
          computedRectProvider.markDirty();
          selectable.children.forEach(markDirtyRecursive);
        }
      };
      markDirtyRecursive(topLevel);
    }
    this.dirtyTopLevels.clear();
  }
}
const computedRectUpdater = new ComputedRectUpdater();

export const NodeRenderer: React.FC<{
  selectable: Selectable;
  parentStackDirection?: StackDirection;
}> = observer(({ selectable, parentStackDirection }) => {
  const style = selectable.style;
  const cssStyle = buildNodeCSS(
    selectable.node.type,
    selectable.style,
    parentStackDirection
  );

  const ref = createRef<HTMLDivElement | HTMLImageElement>();

  useEffect(() => {
    if (ref.current) {
      selectable.computedRectProvider = new ComputedRectProvider(ref.current);
    }
  }, []);

  computedRectUpdater.add(selectable);

  useEffect(() => {
    if (ref.current) {
      selectableForDOM.set(ref.current, selectable);
    }

    computedRectUpdater.flush();
  });

  const childParentStackDirection =
    selectable.node.type === "stack" ? style.stackDirection : undefined;

  if (selectable.node.type === "instance") {
    return (
      <InstanceRenderer
        instanceSelectable={selectable}
        domRef={ref}
        parentStackDirection={childParentStackDirection}
      />
    );
  }

  if (selectable.node.type === "shape") {
    const pathData = selectable.node.path.toSVGPathData();
    return (
      <div style={cssStyle} ref={ref}>
        <svg
          style={{
            width: "100%",
            height: "100%",
          }}
          viewBox={[
            selectable.node.viewBox.left,
            selectable.node.viewBox.top,
            selectable.node.viewBox.width,
            selectable.node.viewBox.height,
          ].join(" ")}
          preserveAspectRatio="none"
        >
          <path fillRule="evenodd" d={pathData} />
        </svg>
      </div>
    );
  }

  if (selectable.node.type === "image") {
    return (
      <img
        style={{
          // reset Tailwind styles
          maxWidth: "unset",
          height: "unset",
          objectFit: "cover",
          ...cssStyle,
        }}
        src={selectable.node.source.dataURL}
        width={selectable.node.source.width}
        height={selectable.node.source.height}
        ref={ref as React.RefObject<HTMLImageElement>}
      />
    );
  }

  return (
    <div style={cssStyle} ref={ref}>
      {selectable.node.type === "text"
        ? String(selectable.node.content) // support prop ref
        : selectable.children.map((child) => (
            <NodeRenderer
              key={child.key}
              selectable={child}
              parentStackDirection={childParentStackDirection}
            />
          ))}
    </div>
  );
});
