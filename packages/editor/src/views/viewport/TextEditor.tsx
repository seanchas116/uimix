import { observer } from "mobx-react-lite";
import { viewportState } from "../../state/ViewportState";

export const TextEditor: React.FC = observer(() => {
  const focused = viewportState.focusedSelectable;
  if (!focus) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
      }}
    >
      {focused?.style.textContent}
    </div>
  );
});
