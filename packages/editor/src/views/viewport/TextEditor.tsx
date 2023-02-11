import { action } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import { Selectable } from "../../models/Selectable";
import { scrollState } from "../../state/ScrollState";
import { viewportState } from "../../state/ViewportState";
import { buildNodeCSS } from "./renderer/buildNodeCSS";

export const TextEditorBody: React.FC<{
  selectable: Selectable;
}> = observer(({ selectable }) => {
  const cssStyle = buildNodeCSS("text", selectable.style);
  const computedRect = selectable.computedRect;

  const editableRef = React.createRef<HTMLDivElement>();

  useEffect(() => {
    const editable = editableRef.current;
    if (!editable) {
      return;
    }
    editable.textContent = selectable.style.textContent ?? "";
  }, []);

  const fitWidth = selectable.style.width.type === "hugContents";

  return (
    <div
      style={{
        position: "absolute",
        transformOrigin: "left top",
        transform: scrollState.documentToViewport.toCSSMatrixString(),
      }}
    >
      <div
        ref={editableRef}
        style={{
          ...cssStyle,
          position: "absolute",
          left: computedRect.left + "px",
          top: computedRect.top + "px",
          width: fitWidth ? "max-content" : computedRect.width + "px",
          height: computedRect.height + "px",
        }}
        contentEditable
        onInput={action((e) => {
          selectable.style.textContent = e.currentTarget.textContent ?? "";
        })}
      />
    </div>
  );
});

export const TextEditor: React.FC = observer(() => {
  const focused = viewportState.focusedSelectable;
  if (!focused) {
    return null;
  }
  return <TextEditorBody selectable={focused} />;
});
