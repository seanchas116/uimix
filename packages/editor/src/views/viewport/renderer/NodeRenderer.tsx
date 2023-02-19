import { observer } from "mobx-react-lite";
import { StackDirection } from "@uimix/node-data";
import React, { createRef, useEffect } from "react";
import { Selectable } from "../../../models/Selectable";
import { viewportState } from "../../../state/ViewportState";
import { buildNodeCSS } from "./buildNodeCSS";
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
        selectable.computedRectProvider?.markDirty();
        selectable.children.forEach(markDirtyRecursive);
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
  const type = selectable.node.type;

  const cssStyle = {
    ...buildNodeCSS(type, style, parentStackDirection),
    ...(selectable === viewportState.focusedSelectable
      ? {
          opacity: 0,
        }
      : undefined),
  };

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

  const stackDirection =
    type === "frame" && style.layout === "stack"
      ? style.stackDirection
      : undefined;

  // if (selectable.node.type === "instance") {
  //   return (
  //     <InstanceRenderer
  //       instanceSelectable={selectable}
  //       domRef={ref}
  //       parentStackDirection={stackDirection}
  //     />
  //   );
  // }

  // if (selectable.node.type === "shape") {
  //   const pathData = selectable.node.path.toSVGPathData();
  //   return (
  //     <div style={cssStyle} ref={ref}>
  //       <svg
  //         style={{
  //           width: "100%",
  //           height: "100%",
  //         }}
  //         viewBox={[
  //           selectable.node.viewBox.left,
  //           selectable.node.viewBox.top,
  //           selectable.node.viewBox.width,
  //           selectable.node.viewBox.height,
  //         ].join(" ")}
  //         preserveAspectRatio="none"
  //       >
  //         <path fillRule="evenodd" d={pathData} />
  //       </svg>
  //     </div>
  //   );
  // }

  // if (selectable.node.type === "image") {
  //   return (
  //     <img
  //       style={{
  //         // reset Tailwind styles
  //         maxWidth: "unset",
  //         height: "unset",
  //         objectFit: "cover",
  //         ...cssStyle,
  //       }}
  //       src={selectable.node.source.dataURL}
  //       width={selectable.node.source.width}
  //       height={selectable.node.source.height}
  //       ref={ref as React.RefObject<HTMLImageElement>}
  //     />
  //   );
  // }

  return (
    <div style={cssStyle} ref={ref}>
      {type === "text"
        ? String(style.textContent) // support prop ref
        : selectable.children.map((child) => (
            <NodeRenderer
              key={child.id}
              selectable={child}
              parentStackDirection={stackDirection}
            />
          ))}
    </div>
  );
});
