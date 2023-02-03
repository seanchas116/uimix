import { CodeEditor } from "./CodeEditor";
import { observer } from "mobx-react-lite";
import { CodeTabs } from "./CodeTabs";

export const CodeEditorArea = observer(() => {
  return (
    <div className="w-[560px] flex flex-col contain-strict">
      <CodeTabs />
      <div className="flex-1 bg-macaron-uiBackground relative">
        <CodeEditor className="absolute left-0 top-0 w-full h-full" />
      </div>
    </div>
  );
});

CodeEditorArea.displayName = "CodeEditorArea";
