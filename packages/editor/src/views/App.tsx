import { observer } from "mobx-react-lite";
import { ToolBar } from "./toolbar/ToolBar";
import { useEffect } from "react";
import { Viewport } from "./viewport/Viewport";
import { InspectorSideBar } from "./inspector/InspectorSideBar";
import { TooltipProvider } from "../components/Tooltip";
import { ContextMenu } from "./ContextMenu";
import { commands } from "../state/Commands";
import { action } from "mobx";
import { OutlineSideBar } from "./outline/OutlineSideBar";
import { FontLoadLink } from "../components/FontLoadLink";
import { projectState } from "../state/ProjectState";

function useKeyHandling() {
  useEffect(() => {
    const onKeyDown = action((e: KeyboardEvent) => {
      if (commands.handleKeyDown(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    const onKeyUp = action((e: KeyboardEvent) => {
      commands.handleKeyUp(e);
    });

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
}

// function useWindowTitle() {
//   useEffect(() => {
//     return reaction(
//       () => projectState.fileName,
//       (fileName) => {
//         document.title = `${fileName} - Site & Component Editor`;
//       },
//       { fireImmediately: true }
//     );
//   }, []);
// }

function useRectUpdateOnFontReload() {
  useEffect(() => {
    const onFontsLoaded = action(() => {
      for (const selected of projectState.selectedSelectables) {
        selected.computedRectProvider?.markDirty();
      }
    });
    document.fonts.addEventListener("loadingdone", onFontsLoaded);
    return () =>
      document.fonts.removeEventListener("loadingdone", onFontsLoaded);
  }, []);
}

const FontLoader = observer(function FontLoader() {
  return (
    <FontLoadLink
      fonts={[...projectState.project.node.selectable.usedFontFamilies]}
    />
  );
});

export const App = observer(function App() {
  useKeyHandling();
  //useWindowTitle();

  useRectUpdateOnFontReload();

  return (
    <TooltipProvider>
      <FontLoader />
      <div className="flex flex-col fixed top-0 left-0 w-full h-full text-macaron-base bg-macaron-background text-macaron-text select-none">
        <ToolBar className="shrink-0" />
        <div className="flex flex-1">
          <OutlineSideBar />
          <div className="flex flex-1 border-l border-r border-macaron-separator">
            <Viewport />
          </div>
          <InspectorSideBar />
        </div>
      </div>
      <ContextMenu />
    </TooltipProvider>
  );
});
