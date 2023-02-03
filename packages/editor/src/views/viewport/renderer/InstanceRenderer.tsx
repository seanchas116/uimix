import { observer } from "mobx-react-lite";
import { StackDirection } from "node-data";
import { Selectable } from "../../../models/Selectable";
import { createCascadedStyle, PartialStyle } from "../../../models/Style";
import { buildNodeCSS } from "./buildNodeCSS";

const InstanceNodeRenderer = observer(function InstanceNodeRenderer({
  selectable,
  additionalStyle,
  parentStackDirection,
  domRef,
}: {
  selectable: Selectable;
  additionalStyle?: PartialStyle;
  parentStackDirection?: StackDirection;
  domRef?: React.Ref<HTMLDivElement>;
}) {
  const style = additionalStyle
    ? createCascadedStyle(additionalStyle, selectable.style)
    : selectable.style;
  const cssStyle = buildNodeCSS(
    selectable.node.type,
    style,
    parentStackDirection
  );

  return (
    <div style={cssStyle} ref={domRef}>
      {selectable.node.type === "text"
        ? String(selectable.node.content) // support prop ref
        : selectable.children.map((child) => (
            <InstanceNodeRenderer
              key={child.key}
              selectable={child}
              parentStackDirection={
                selectable.node.type === "stack"
                  ? style.stackDirection
                  : undefined
              }
            />
          ))}
    </div>
  );
});

export const InstanceRenderer = observer(function InstanceRenderer({
  instanceSelectable,
  domRef,
  parentStackDirection,
}: {
  instanceSelectable: Selectable;
  domRef?: React.Ref<HTMLDivElement>;
  parentStackDirection?: StackDirection;
}): JSX.Element | null {
  const node = instanceSelectable.node;
  if (node.type !== "instance") {
    throw new Error("InstanceRenderer must be used with an instance node");
  }

  const rootNode = node.componentRootNode;
  if (!rootNode) {
    return null;
  }

  return (
    <InstanceNodeRenderer
      selectable={Selectable.get(rootNode)}
      domRef={domRef}
      parentStackDirection={parentStackDirection}
      additionalStyle={instanceSelectable.partialStyle}
    />
  );
});
