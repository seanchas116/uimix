import React, { useCallback } from "react";
import { Icon } from "@iconify/react";
import menuIcon from "@iconify-icons/ic/menu";
import rectIcon from "@seanchas116/design-icons/json/rect.json";
import textIcon from "@seanchas116/design-icons/json/text.json";
import imageIcon from "@seanchas116/design-icons/json/image.json";
import { observer } from "mobx-react-lite";
import { ZoomControl } from "../../components/ZoomControl";
import { scrollState } from "../../state/ScrollState";
import { action } from "mobx";
import { twMerge } from "tailwind-merge";
import { DropdownMenu } from "../../components/Menu";
import { ToolButton } from "../../components/ToolButton";
import { commands } from "../../state/Commands";
import { viewportState } from "../../state/ViewportState";

export const ToolBar = observer(function ToolBar({
  className,
}: {
  className?: string;
}) {
  const onZoomOut = useCallback(
    action(() => scrollState.zoomOut()),
    []
  );
  const onZoomIn = useCallback(
    action(() => scrollState.zoomIn()),
    []
  );
  const onChangeZoomPercent = useCallback(
    action((percent: number) => scrollState.zoomAroundCenter(percent / 100)),
    []
  );

  return (
    <div
      className={twMerge(
        "box-content h-8 border-b border-macaron-separator bg-macaron-background text-macaron-text flex items-center justify-center relative",
        className
      )}
    >
      <div className="absolute left-3 top-0 bottom-0 flex items-center">
        <DropdownMenu
          defs={commands.menu}
          trigger={(props) => (
            <ToolButton {...props}>
              <Icon icon={menuIcon} width={20} />
            </ToolButton>
          )}
        />
      </div>

      <div className="flex">
        <ToolButton
          aria-pressed={viewportState.insertMode?.type === "frame"}
          onClick={action(() => {
            commands.insertFrame();
          })}
        >
          <Icon icon={rectIcon} />
        </ToolButton>
        <ToolButton
          aria-pressed={viewportState.insertMode?.type === "text"}
          onClick={action(() => {
            commands.insertText();
          })}
        >
          <Icon icon={textIcon} />
        </ToolButton>
        <ToolButton
          aria-pressed={viewportState.insertMode?.type === "image"}
          onClick={action(async () => {
            await commands.insertImage();
          })}
        >
          <Icon icon={imageIcon} />
        </ToolButton>
      </div>

      <div className="absolute right-3 top-0 bottom-0 flex items-center">
        <ZoomControl
          percentage={Math.round(scrollState.scale * 100)}
          onZoomOut={onZoomOut}
          onZoomIn={onZoomIn}
          onChangePercentage={onChangeZoomPercent}
        />
      </div>
    </div>
  );
});
