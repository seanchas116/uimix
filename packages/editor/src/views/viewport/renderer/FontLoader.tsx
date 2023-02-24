import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { FontLoadLink } from "../../../components/FontLoadLink";
import { projectState } from "../../../state/ProjectState";

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

export const FontLoader = observer(function FontLoader() {
  useRectUpdateOnFontReload();

  return (
    <FontLoadLink
      fonts={[...projectState.project.node.selectable.usedFontFamilies]}
    />
  );
});
