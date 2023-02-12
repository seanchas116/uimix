import { action } from "mobx";
import React from "react";
import { projectState } from "../../state/ProjectState";
import { Selectable } from "../../models/Selectable";
import { observer } from "mobx-react-lite";
import { scrollState } from "../../state/ScrollState";
import { usePointerStroke } from "../../components/hooks/usePointerStroke";
import { DragHandler } from "./dragHandler/DragHandler";
import { NodeClickMoveDragHandler } from "./dragHandler/NodeClickMoveDragHandler";
import { NodePickResult } from "./renderer/NodePicker";
import { viewportState } from "../../state/ViewportState";
import { Icon, IconifyIcon } from "@iconify/react";

// const LabelWrap = styled.div`
//   pointer-events: all;
//   position: absolute;
//   transform: translateY(-100%);
//   color: ${colors.text};
//   font-size: 12px;
//   line-height: 16px;
//   white-space: nowrap;
//   display: flex;
//   align-items: center;
//   gap: 2px;
// `;

const Label: React.FC<{
  frame: Selectable;
}> = observer(function Label({ frame }) {
  const pos = frame.computedRect.transform(scrollState.documentToViewport);

  const dragProps = usePointerStroke<Element, DragHandler | undefined>({
    onBegin: action((event) => {
      return NodeClickMoveDragHandler.create(
        new NodePickResult(
          [frame],
          scrollState.documentPosForEvent(event),
          event.nativeEvent,
          "click"
        )
      );
    }),
    onMove: action((e, { initData: dragHandler }) => {
      dragHandler?.move(e.nativeEvent);
    }),
    onEnd: action((e, { initData: dragHandler }) => {
      dragHandler?.end(e.nativeEvent);
    }),
    onHover: action(() => {
      viewportState.hoveredSelectable = frame;
    }),
  });
  const onPointerLeave = action(() => {
    viewportState.hoveredSelectable = undefined;
  });
  // TODO: context menu
  // const onContextMenu = action((e: React.MouseEvent) => {
  //   e.preventDefault();
  //   editorState.page.deselectAll();
  //   override.select();
  //   editorState.showContextMenu(e, layerContextMenu(editorState));
  // });

  let iconSrc: IconifyIcon | undefined;
  // if (override.originalLayer.component) {
  //   iconSrc = icon_widgets_filled;
  // } else if (override.originalLayer.type === "instance") {
  //   if (override.originalLayer.variant) {
  //     iconSrc = switchIcon;
  //   } else {
  //     iconSrc = icon_widgets_outline;
  //   }
  // }

  return (
    <div
      style={{
        left: `${pos.left}px`,
        top: `${pos.top}px`,
        //pointerEvents: frame.isLocked ? "none" : "auto",
      }}
      className="text-macaron-text/50 absolute pointer-events-all text-xs pb-1 translate-y-[-100%]"
      {...dragProps}
      onPointerLeave={onPointerLeave}
      //onContextMenu={onContextMenu}
    >
      {iconSrc && <Icon icon={iconSrc} className="text-xs" />}
      {frame.originalNode.name}
    </div>
  );
});

export const FrameLabels: React.FC = observer(function FrameLabels({}) {
  const frames = projectState.rootSelectable.children.filter(
    (s) => s.node.type === "frame"
  );

  return (
    <>
      {frames.map((frame) => (
        <Label frame={frame} key={frame.id} />
      ))}
    </>
  );
});
