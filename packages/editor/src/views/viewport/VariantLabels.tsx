import React, { createRef, useEffect } from "react";
import { projectState } from "../../state/ProjectState";
import { Selectable } from "../../models/Selectable";
import { observer } from "mobx-react-lite";
import { scrollState } from "../../state/ScrollState";
import { getIconAndTextForCondition } from "../inspector/style/ComponentPane";
import { selectableForDOM } from "./renderer/NodeRenderer";
import { Icon } from "@iconify/react";
import { usePointerStroke } from "../../components/hooks/usePointerStroke";
import { DragHandler } from "./dragHandler/DragHandler";
import { NodeClickMoveDragHandler } from "./dragHandler/NodeClickMoveDragHandler";
import { NodePickResult } from "./renderer/NodePicker";
import { action } from "mobx";
import { viewportState } from "../../state/ViewportState";
import { IconButton } from "../../components/IconButton";
import { DropdownMenu } from "../../components/Menu";

const VariantLabel: React.FC<{
  variantSelectable: Selectable;
}> = observer(function Label({ variantSelectable }) {
  const variant = variantSelectable.originalNode;
  const pos = variantSelectable.computedRect.transform(
    scrollState.documentToViewport
  );

  const condition = variant.type === "variant" ? variant.condition : undefined;
  const { text, icon } = getIconAndTextForCondition(
    condition ?? { type: "default" }
  );

  const ref = createRef<HTMLDivElement>();
  useEffect(() => {
    if (ref.current) {
      selectableForDOM.set(ref.current, variantSelectable);
    }
  });

  const dragProps = usePointerStroke<Element, DragHandler | undefined>({
    onBegin: action((e) => {
      return new NodeClickMoveDragHandler(
        variantSelectable,
        new NodePickResult(
          [variantSelectable],
          scrollState.documentPosForEvent(e.nativeEvent),
          e.nativeEvent,
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
      viewportState.hoveredSelectable = variantSelectable;
    }),
  });
  const onPointerLeave = action(() => {
    viewportState.hoveredSelectable = undefined;
  });

  const component = variant.parent;

  return (
    <div
      ref={ref}
      style={{
        left: `${pos.left}px`,
        top: `${pos.top - 32}px`,
        minWidth: `${pos.width}px`,
        width: "max-content",
        //pointerEvents: frame.isLocked ? "none" : "auto",
      }}
      className="
        absolute flex p-1 gap-1 items-center rounded-md
        bg-neutral-500/10
        text-neutral-500
        hover:bg-blue-500/10
        hover:text-blue-500
        aria-selected:bg-blue-500/10
        aria-selected:text-blue-500
      "
      aria-selected={variantSelectable.selected}
      //onContextMenu={onContextMenu}
      {...dragProps}
      onPointerLeave={onPointerLeave}
    >
      <Icon icon={icon} className="text-base" />
      <span className="text-xs font-medium flex-1 mr-1">
        <span>{variant.parent?.name}</span> › <span>{text}</span>
      </span>
      <DropdownMenu
        trigger={(props) => (
          <button
            className="-m-1 p-1 hover:bg-blue-500/10 rounded"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            {...props}
          >
            <Icon icon="mdi:add" className="text-base" />
          </button>
        )}
        defs={[
          {
            type: "command",
            text: "Add Variant",
            onClick: action(() => {
              console.log("onClick");
              component?.append([
                {
                  type: "variant",
                  condition: {
                    type: "hover",
                  },
                },
              ]);
              projectState.undoManager.stopCapturing();
            }),
          },
          {
            type: "command",
            text: "Add Breakpoint",
            onClick: action(() => {
              component?.append([
                {
                  type: "variant",
                  condition: {
                    type: "maxWidth",
                    value: 767,
                  },
                },
              ]);
              projectState.undoManager.stopCapturing();
            }),
          },
        ]}
      />
    </div>
  );
});

export const VariantLabels: React.FC = observer(function FrameLabels({}) {
  const components = projectState.rootSelectable.children.filter(
    (s) => s.node.type === "component"
  );

  return (
    <>
      {components.map((component) => (
        <>
          {component.children.map((variant) => (
            <VariantLabel variantSelectable={variant} key={variant.id} />
          ))}
        </>
      ))}
    </>
  );
});
