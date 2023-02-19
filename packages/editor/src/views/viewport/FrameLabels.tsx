import React, { createRef, useEffect } from "react";
import { projectState } from "../../state/ProjectState";
import { Selectable } from "../../models/Selectable";
import { observer } from "mobx-react-lite";
import { scrollState } from "../../state/ScrollState";
import { Icon, IconifyIcon } from "@iconify/react";
import { Rect } from "paintvec";
import { getIconAndTextForCondition } from "../inspector/style/ComponentPane";
import { selectableForDOM } from "./renderer/NodeRenderer";

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

const ComponentSection: React.FC<{
  component: Selectable;
}> = observer(function ComponentSection({ component }) {
  const rects = component.children.map((c) => c.computedRect);
  const bbox = Rect.union(...rects);
  if (!bbox) {
    return null;
  }
  const bboxInView = bbox.transform(scrollState.documentToViewport);
  const topPadding = 32;
  const padding = 16;

  return (
    <>
      <div
        className="border border-neutral-300 bg-neutral-200 rounded-md"
        style={{
          position: "absolute",
          left: bboxInView.left - padding + "px",
          top: bboxInView.top - topPadding + "px",
          width: bboxInView.width + padding * 2 + "px",
          height: bboxInView.height + padding + topPadding + "px",
          pointerEvents: "none",
        }}
      />
      {component.children.map((variant) => {
        const condition =
          variant.originalNode.type === "variant"
            ? variant.originalNode.condition
            : undefined;
        const { text } = getIconAndTextForCondition(
          condition ?? { type: "default" }
        );

        return <Label frame={variant} text={text} />;
      })}
    </>
  );
});

const Label: React.FC<{
  frame: Selectable;
  text: React.ReactNode;
}> = observer(function Label({ frame, text }) {
  const pos = frame.computedRect.transform(scrollState.documentToViewport);

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

  const ref = createRef<HTMLDivElement>();

  useEffect(() => {
    if (ref.current) {
      selectableForDOM.set(ref.current, frame);
    }
  });

  return (
    <div
      ref={ref}
      style={{
        left: `${pos.left}px`,
        top: `${pos.top}px`,
        //pointerEvents: frame.isLocked ? "none" : "auto",
      }}
      className="text-macaron-text/50 absolute pointer-events-all text-macaron-base pb-1 translate-y-[-100%]"
      //onContextMenu={onContextMenu}
    >
      {iconSrc && <Icon icon={iconSrc} className="text-xs" />}
      {text}
    </div>
  );
});

export const FrameLabels: React.FC = observer(function FrameLabels({}) {
  const frames = projectState.rootSelectable.children.filter(
    (s) => s.node.type === "frame"
  );
  const components = projectState.rootSelectable.children.filter(
    (s) => s.node.type === "component"
  );

  return (
    <>
      {components.map((component) => (
        <ComponentSection component={component} key={component.id} />
      ))}
      {frames.map((frame) => (
        <Label frame={frame} key={frame.id} text={frame.originalNode.name} />
      ))}
    </>
  );
});
