import { useEffect, createRef } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { reaction } from "mobx";
import { codeEditorsState } from "../../state/CodeEditorsState";

export function CodeEditor({ className }: { className?: string }) {
  const monacoEl = createRef<HTMLDivElement>();

  useEffect(() => {
    if (monacoEl.current) {
      const editor = monaco.editor.create(monacoEl.current, {
        automaticLayout: true,
        minimap: {
          enabled: false,
        },
      });

      const disposer = reaction(
        () => codeEditorsState.activeEditorState?.model,
        (model) => {
          editor.setModel(model ?? null);
        },
        { fireImmediately: true }
      );

      return () => {
        disposer();
        editor.dispose();
      };
    }
  }, [monacoEl.current]);

  return <div className={className} ref={monacoEl}></div>;
}
