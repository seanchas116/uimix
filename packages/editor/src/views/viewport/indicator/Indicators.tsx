import { DragIndicators } from "./DragIndicators";
import { HoverIndicator } from "./HoverIndicator";
import { NodeResizeBox } from "./NodeResizeBox";
import { SnapIndicators } from "./SnapIndicators";

export function Indicators() {
  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
      <HoverIndicator />
      <DragIndicators />
      <NodeResizeBox />
      <SnapIndicators />
    </svg>
  );
}
