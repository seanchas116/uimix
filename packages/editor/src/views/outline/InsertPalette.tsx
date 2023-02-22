import { compact } from "lodash-es";
import { observer } from "mobx-react-lite";
import { Component } from "../../models/Component";
import { projectState } from "../../state/ProjectState";
import { SearchInput } from "./SearchInput";
import { NodeRenderer } from "../viewport/renderer/NodeRenderer";
import { usePointerStroke } from "../../components/hooks/usePointerStroke";
import { scrollState } from "../../state/ScrollState";
import { NodeAbsoluteMoveDragHandler } from "../viewport/dragHandler/NodeAbsoluteMoveDragHandler";
import { ReactNode, useRef, useState } from "react";
import { DragHandler } from "../viewport/dragHandler/DragHandler";
import { Vec2 } from "paintvec";
import { useResizeObserver } from "../../components/hooks/useResizeObserver";
import { QueryTester } from "../../utils/QueryTester";

export const InsertPalette: React.FC = observer(() => {
  const pages = projectState.project.pages.all;
  const [searchText, setSearchText] = useState("");
  const queryTester = new QueryTester(searchText);

  const sections = compact(
    pages.map((page) => {
      const components = compact(
        page.children.map((c) => {
          if (queryTester.test(c.name)) return Component.from(c);
        })
      );
      if (!components.length) {
        return null;
      }

      return (
        <div className="flex flex-col gap-3">
          <h2 className="text-macaron-base text-macaron-label font-semibold px-0.5">
            {page.name}
          </h2>
          {components.map((c) => (
            <ComponentThumbnail component={c} />
          ))}
        </div>
      );
    })
  );

  return (
    <div className="">
      <SearchInput
        placeholder="Search"
        value={searchText}
        onChangeValue={setSearchText}
      />

      <div className="flex flex-col p-3 gap-4">
        {sections.length ? (
          sections
        ) : (
          <div className="text-macaron-disabledText text-center">
            No components in the project
          </div>
        )}
      </div>
    </div>
  );
});

InsertPalette.displayName = "InsertPalette";

const ComponentThumbnail: React.FC<{
  component: Component;
}> = observer(({ component }) => {
  const status = useRef<{
    dragHandler: DragHandler | undefined;
    creating: boolean;
  }>({
    dragHandler: undefined,
    creating: false,
  });

  const dragProps = usePointerStroke({
    onBegin: async (e) => {
      status.current.creating = false;
    },
    onMove: (e, {}) => {
      if (!status.current.dragHandler && !status.current.creating) {
        const isInViewport = scrollState.viewportDOMClientRect.includes(
          new Vec2(e.clientX, e.clientY)
        );
        if (isInViewport) {
          const pos = scrollState.documentPosForEvent(e);

          const project = projectState.project;
          const page = projectState.page;
          if (!page) {
            return;
          }

          const instanceNode = project.nodes.create("instance");
          instanceNode.name = "Instance";
          page.append([instanceNode]);

          const instanceNodeStyle = instanceNode.selectable.style;
          instanceNodeStyle.position = {
            x: { type: "start", start: pos.x },
            y: { type: "start", start: pos.y },
          };
          instanceNodeStyle.mainComponentID = component.node.id;

          page.selectable.deselect();
          instanceNode.selectable.select();

          status.current.creating = true;
          setTimeout(() => {
            status.current.dragHandler = new NodeAbsoluteMoveDragHandler(
              [instanceNode.selectable],
              pos
            );
          }, 0);
        }
      }
      status.current.dragHandler?.move(e.nativeEvent);
    },
    onEnd: (e) => {
      if (status.current.dragHandler) {
        status.current.dragHandler.end(e.nativeEvent);
        status.current.dragHandler = undefined;
      }
    },
  });

  return (
    <div
      className="p-2 bg-macaron-uiBackground border border-macaron-separator rounded relative cursor-copy group overflow-hidden"
      {...dragProps}
    >
      <ThumbnailResizer>
        <NodeRenderer
          selectable={component.rootNode.selectable}
          style={{
            position: "relative",
            left: 0,
            top: 0,
          }}
          forThumbnail
        />
      </ThumbnailResizer>
      <div className="absolute left-0 bottom-0 right-0 text-center text-macaron-label text-xs p-1 bg-macaron-label/30 text-white opacity-0 group-hover:opacity-100 transition">
        {component.node.name}
      </div>
    </div>
  );
});
ComponentThumbnail.displayName = "ComponentThumbnail";

const ThumbnailResizer: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperSize = useResizeObserver(wrapperRef);
  const contentSize = useResizeObserver(contentRef);
  const scale = Math.min(wrapperSize[0] / contentSize[0], 1);

  return (
    <div className="w-full pointer-events-none" ref={wrapperRef}>
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          height: contentSize[1] * scale + "px",
        }}
      >
        <div className="w-fit h-fit absolute" ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  );
};
