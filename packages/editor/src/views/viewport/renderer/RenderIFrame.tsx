import { observer } from "mobx-react-lite";
import React from "react";
import { IFrame } from "../../../components/IFrame";
import { ForeignComponentManager } from "../../../models/ForeignComponentManager";
import { projectState } from "../../../state/ProjectState";
import { scrollState } from "../../../state/ScrollState";
import { viewportRootMarker } from "./ComputedRectProvider";
import { FontLoader } from "./FontLoader";
import { nodePicker } from "./NodePicker";
import { NodeRenderer } from "./NodeRenderer";

const RenderIFrameBody: React.FC = observer(() => {
  return (
    <div
      style={{
        position: "absolute",
        transformOrigin: "left top",
        transform: scrollState.documentToViewport.toCSSMatrixString(),
      }}
      {...{
        [viewportRootMarker]: true,
      }}
    >
      {projectState.page?.selectable.children.map((child) => (
        <NodeRenderer
          key={child.id}
          selectable={child}
          foreignComponentManager={ForeignComponentManager.global!}
        />
      ))}
    </div>
  );
});
RenderIFrameBody.displayName = "RenderIFrameBody";

export const RenderIFrame: React.FC = () => {
  return (
    <IFrame
      className="absolute inset-0 w-full h-full"
      init={(window) => {
        ForeignComponentManager.init(window);

        nodePicker.document = window.document;

        return (
          <>
            <FontLoader />
            <RenderIFrameBody />
          </>
        );
      }}
    />
  );
};

RenderIFrame.displayName = "RenderIFrame";
