import React, { createRef, useEffect, useState } from "react";
import * as RadixPopover from "@radix-ui/react-popover";
import { projectState } from "../../state/ProjectState";
import { Selectable } from "../../models/Selectable";
import { observer } from "mobx-react-lite";
import { scrollState } from "../../state/ScrollState";
import {
  ConditionEditor,
  getIconAndTextForCondition,
} from "../inspector/style/ComponentPane";
import { selectableForDOM } from "./renderer/NodeRenderer";
import { Icon } from "@iconify/react";
import { usePointerStroke } from "../../components/hooks/usePointerStroke";
import { DragHandler } from "./dragHandler/DragHandler";
import { NodeClickMoveDragHandler } from "./dragHandler/NodeClickMoveDragHandler";
import { NodePickResult } from "./renderer/NodePicker";
import { action } from "mobx";
import { viewportState } from "../../state/ViewportState";
import { DropdownMenu } from "../../components/Menu";
import { popoverStyle } from "../../components/styles";
import { Rect, Vec2 } from "paintvec";
import { resizeWithBoundingBox } from "../../services/Resize";
import { twMerge } from "tailwind-merge";

const componentSectionTopPadding = 48;
const componentSectionPadding = 16;

const ComponentSection: React.FC<{
  component: Selectable;
}> = observer(function ComponentSection({ component }) {
  const rects = component.children.map((c) => c.computedRect);
  const bbox = Rect.union(...rects);
  if (!bbox) {
    return null;
  }
  const bboxInView = bbox.transform(scrollState.documentToViewport);

  return (
    <div
      className={twMerge(
        "border border-neutral-300 border-dashed rounded-md",
        component.selected && "border-macaron-active"
      )}
      style={{
        position: "absolute",
        left: bboxInView.left - componentSectionPadding + "px",
        top: bboxInView.top - componentSectionTopPadding + "px",
        width: bboxInView.width + componentSectionPadding * 2 + "px",
        height:
          bboxInView.height +
          componentSectionPadding +
          componentSectionTopPadding +
          "px",
        pointerEvents: "none",
      }}
    />
  );
});

export const ComponentSections: React.FC = observer(function VariantLabels() {
  const components = projectState.rootSelectable.children.filter(
    (s) => s.node.type === "component"
  );

  return (
    <>
      {components.map((component) => (
        <ComponentSection component={component} key={component.id} />
      ))}
    </>
  );
});

class ComponentLabelDragHandler implements DragHandler {
  constructor(event: PointerEvent, component: Selectable) {
    this.initPos = scrollState.documentPosForEvent(event);
    this.targets = component.children.map((c) => [c.computedRect, c]);

    if (!(event.shiftKey || event.metaKey)) {
      projectState.rootSelectable.deselect();
    }
    component.select();
  }

  initPos: Vec2;
  targets: [Rect, Selectable][];

  move(event: PointerEvent) {
    const pos = scrollState.documentPosForEvent(event);
    const offset = pos.sub(this.initPos);

    for (const [rect, target] of this.targets) {
      resizeWithBoundingBox(target, rect.translate(offset), {
        x: true,
        y: true,
      });
    }
  }

  end() {}
}

const ComponentLabel: React.FC<{
  component: Selectable;
}> = observer(function ComponentSection({ component }) {
  const rects = component.children.map((c) => c.computedRect);
  const bbox = Rect.union(...rects);
  if (!bbox) {
    return null;
  }
  const bboxInView = bbox.transform(scrollState.documentToViewport);

  const dragProps = usePointerStroke<Element, DragHandler | undefined>({
    onBegin: action((e) => {
      if (e.button !== 0) {
        return;
      }
      return new ComponentLabelDragHandler(e.nativeEvent, component);
    }),
    onMove: action((e, { initData: dragHandler }) => {
      dragHandler?.move(e.nativeEvent);
    }),
    onEnd: action((e, { initData: dragHandler }) => {
      dragHandler?.end(e.nativeEvent);
    }),
    onHover: action(() => {
      viewportState.hoveredSelectable = component;
    }),
  });
  const onPointerLeave = action(() => {
    viewportState.hoveredSelectable = undefined;
  });

  return (
    <div
      className={twMerge(
        "absolute text-macaron-base text-neutral-500 font-medium flex gap-1",
        component.selected && "text-macaron-active"
      )}
      style={{
        left: bboxInView.left - componentSectionPadding + "px",
        top: bboxInView.top - componentSectionTopPadding - 20 + "px",
      }}
      {...dragProps}
      onPointerLeave={onPointerLeave}
    >
      <Icon
        icon="material-symbols:widgets-rounded"
        className="text-base text-macaron-component"
      />
      {component.originalNode.name}
    </div>
  );
});

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

  const [conditionEditorOpen, setConditionEditorOpen] = useState(false);

  const component = variant.parent;
  if (!component) {
    return null;
  }

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
    >
      {variant.condition && (
        <RadixPopover.Root
          open={conditionEditorOpen}
          onOpenChange={(open) => setConditionEditorOpen(open)}
        >
          <RadixPopover.Trigger>
            <div className="absolute inset-0 pointer-events-none" />
          </RadixPopover.Trigger>
          <RadixPopover.Portal>
            <RadixPopover.Content
              side="bottom"
              align="start"
              alignOffset={-4}
              sideOffset={16}
              className={`w-[200px] ${popoverStyle} rounded-lg shadow-xl p-2 flex flex-col gap-2`}
            >
              <ConditionEditor
                value={variant.condition}
                onChangeValue={action((value) => {
                  variant.condition = value;
                  projectState.undoManager.stopCapturing();
                })}
              />
            </RadixPopover.Content>
          </RadixPopover.Portal>
        </RadixPopover.Root>
      )}
      <div
        className="absolute inset-0 z-0"
        {...dragProps}
        onPointerLeave={onPointerLeave}
        onDoubleClick={() => {
          setConditionEditorOpen(true);
        }}
      />
      <Icon icon={icon} className="text-base" />
      <span className="text-macaron-base font-medium flex-1 mr-1">{text}</span>
      <DropdownMenu
        trigger={(props) => (
          <button
            className="-m-1 p-1 hover:bg-blue-500/10 rounded relative z-10"
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

              const variant = projectState.project.nodes.create("variant");
              variant.condition = {
                type: "hover",
              };
              component.append([variant]);

              projectState.page.selectable.deselect();
              variant.selectable.select();
              projectState.undoManager.stopCapturing();
            }),
          },
          {
            type: "command",
            text: "Add Breakpoint",
            onClick: action(() => {
              const variant = projectState.project.nodes.create("variant");
              variant.condition = {
                type: "maxWidth",
                value: 767,
              };
              component.append([variant]);

              projectState.page.selectable.deselect();
              variant.selectable.select();
              projectState.undoManager.stopCapturing();
            }),
          },
        ]}
      />
    </div>
  );
});

export const VariantLabels: React.FC = observer(function VariantLabels() {
  const components = projectState.rootSelectable.children.filter(
    (s) => s.node.type === "component"
  );

  return (
    <>
      {components.map((component) => (
        <ComponentLabel component={component} key={component.id} />
      ))}
      {components.flatMap((component) =>
        component.children.map((variant) => (
          <VariantLabel variantSelectable={variant} key={variant.id} />
        ))
      )}
    </>
  );
});
