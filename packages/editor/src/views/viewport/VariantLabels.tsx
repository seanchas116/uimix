import React, { createRef, useEffect } from "react";
import { projectState } from "../../state/ProjectState";
import { Selectable } from "../../models/Selectable";
import { observer } from "mobx-react-lite";
import { scrollState } from "../../state/ScrollState";
import { getIconAndTextForCondition } from "../inspector/style/ComponentPane";
import { selectableForDOM } from "./renderer/NodeRenderer";
import { Icon } from "@iconify/react";

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
      className="absolute flex p-1 gap-1 items-center bg-neutral-500/10 rounded-md text-neutral-500"
      //onContextMenu={onContextMenu}
    >
      <Icon icon={icon} className="text-xs" />
      <span className="text-xs font-normal">
        <span className="font-normal">{variant.parent?.name}</span> -{" "}
        <span>{text}</span>
      </span>
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
