import { observer } from "mobx-react-lite";
import { Selectable } from "../../models/Selectable";
import { scrollState } from "../../state/ScrollState";
import { viewportState } from "../../state/ViewportState";
import { buildNodeCSS } from "./renderer/buildNodeCSS";

export const TextEditorBody: React.FC<{
  selectable: Selectable;
}> = observer(({ selectable }) => {
  const cssStyle = buildNodeCSS("text", selectable.style);
  const computedRect = selectable.computedRect;

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
          width: computedRect.width + "px",
          height: computedRect.height + "px",
        }}
        contentEditable
      >
        {selectable.style.textContent}
      </div>
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
