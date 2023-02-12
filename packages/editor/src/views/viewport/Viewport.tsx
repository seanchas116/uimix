import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { Rect, Vec2 } from "paintvec";
import { createRef, useEffect } from "react";
import { projectState } from "../../state/ProjectState";
import { scrollState } from "../../state/ScrollState";
import { NodeRenderer } from "./renderer/NodeRenderer";
import { viewportRootMarker } from "./renderer/ComputedRectProvider";
import { PanOverlay } from "./PanOverlay";
import { DragHandlerOverlay } from "./dragHandler/DragHandlerOverlay";
import { Indicators } from "./indicator/Indicators";
import { TextEditor } from "./TextEditor";
import { FrameLabels } from "./FrameLabels";

export const Viewport: React.FC = observer(function Viewport() {
  const ref = createRef<HTMLDivElement>();

  useEffect(() => {
    const elem = ref.current;
    if (!elem) {
      return;
    }

    const updateViewportClientRect = action(() => {
      console.log("update viewport");
      scrollState.viewportDOMClientRect = Rect.from(
        elem.getBoundingClientRect()
      );
    });

    updateViewportClientRect();

    const resizeObserver = new ResizeObserver(updateViewportClientRect);
    resizeObserver.observe(elem);

    window.addEventListener("scroll", updateViewportClientRect);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateViewportClientRect);
    };
  }, []);

  const canvasSelectable = projectState.rootSelectable;

  const onWheel = action((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const factor = Math.pow(2, -e.deltaY / 100);
      const pos = new Vec2(e.clientX, e.clientY).sub(
        scrollState.viewportDOMClientRect.topLeft
      );
      scrollState.zoomAround(pos, scrollState.scale * factor);

      if (!projectState.document.root.childCount) {
        // No layers in page
        scrollState.translation = new Vec2(0);
      }
    } else {
      if (!projectState.document.root.childCount) {
        // No layers in page
        return;
      }
      scrollState.translation = scrollState.translation.sub(
        new Vec2(e.deltaX, e.deltaY).round
      );
    }
  });

  return (
    <div
      ref={ref}
      className="flex-1 bg-macaron-viewportBackground relative overflow-hidden contain-strict"
      onWheel={onWheel}
    >
      <div
        style={{
          position: "absolute",
          transformOrigin: "left top",
          transform: scrollState.documentToViewport.toCSSMatrixString(),
        }}
        {...{
          [viewportRootMarker]: true,
        }}
      >
        {canvasSelectable.children.map((child) => (
          <NodeRenderer key={child.id} selectable={child} />
        ))}
      </div>
      <DragHandlerOverlay />
      <FrameLabels />
      <Indicators />
      <TextEditor />
      <PanOverlay />
    </div>
  );
});
