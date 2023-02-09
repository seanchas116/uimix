import React from "react";
import { observer } from "mobx-react-lite";
import colors from "../../../colors.js";
import { scrollState } from "../../../state/ScrollState";
import { viewportState } from "../../../state/ViewportState";

export const HoverIndicator: React.FC = observer(function HoverIndicator() {
  const hoverRect = viewportState.hoveredSelectable?.computedRect?.transform(
    scrollState.documentToViewport
  );

  return hoverRect ? (
    <rect
      x={hoverRect.left}
      y={hoverRect.top}
      width={hoverRect.width}
      height={hoverRect.height}
      fill="none"
      strokeWidth={2}
      stroke={colors.active}
    />
  ) : null;
});
