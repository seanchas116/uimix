import { action } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo } from "react";
import { Selectable } from "../../models/Selectable";
import { scrollState } from "../../state/ScrollState";
import { viewportState } from "../../state/ViewportState";
import { buildNodeCSS } from "./renderer/buildNodeCSS";
import { createEditor } from "slate";
import { Slate, Editable, withReact } from "slate-react";

export const TextEditorBody: React.FC<{
  selectable: Selectable;
}> = observer(({ selectable }) => {
  const style = selectable.style;

  const cssStyle = buildNodeCSS("text", style);
  const computedRect = selectable.computedRect;

  const fitWidth = style.width.type === "hugContents";

  const editor = useMemo(() => withReact(createEditor()), []);

  return (
    <div
      style={{
        position: "absolute",
        transformOrigin: "left top",
        transform: scrollState.documentToViewport.toCSSMatrixString(),
      }}
    >
      <div
        style={{
          ...cssStyle,
          position: "absolute",
          left: computedRect.left + "px",
          top: computedRect.top + "px",
          width: fitWidth ? "max-content" : computedRect.width + "px",
          height: computedRect.height + "px",
        }}
      >
        <Slate
          editor={editor}
          onChange={action((value) => {
            style.textContent = value[0].children[0].text;
          })}
          value={[
            {
              type: "paragraph",
              children: [
                {
                  text: style.textContent,
                },
              ],
            },
          ]}
        >
          <Editable />
        </Slate>
      </div>
    </div>
  );
});

export const TextEditor: React.FC = observer(() => {
  const focused = viewportState.focusedSelectable;
  if (!focused) {
    return null;
  }
  return <TextEditorBody selectable={focused} key={focused.id} />;
});
