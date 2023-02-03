import widgetsIcon from "@iconify-icons/ic/widgets";
import closeIcon from "@iconify-icons/ic/close";
import fileIcon from "@iconify-icons/ic/outline-insert-drive-file";
import { Icon } from "@iconify/react";
import { CodeEditorState } from "../../state/CodeEditorState";
import { codeEditorsState } from "../../state/CodeEditorsState";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import { action } from "mobx";
import { ReactSortable } from "react-sortablejs";

const CodeTabItem = observer(
  ({ editorState }: { editorState: CodeEditorState }) => {
    const selected = codeEditorsState.activeID === editorState.code.id;

    return (
      <div
        role="tab"
        aria-selected={selected}
        className="leading-8 px-8 border-r border-macaron-separator relative"
        onMouseDown={action((e) => {
          if (e.button === 0) {
            codeEditorsState.open(editorState.code.id);
          }
        })}
      >
        <div
          className={clsx("flex gap-1 items-center", !selected && "opacity-40")}
        >
          {editorState.source.type === "component" ? (
            <Icon icon={widgetsIcon} className="text-macaron-component" />
          ) : (
            <Icon icon={fileIcon} />
          )}
          {editorState.title}
        </div>
        {selected && (
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-macaron-active" />
        )}
        <button
          className="group absolute rounded p-0.5 h-4 top-0 bottom-0 right-1 my-auto text-macaron-label group-hover:text-macaron-text hover:bg-macaron-uiBackground"
          onMouseDown={action((e) => {
            if (e.button === 0) {
              e.stopPropagation();
              codeEditorsState.close(editorState.code.id);
            }
          })}
        >
          <Icon icon={closeIcon} />
        </button>
      </div>
    );
  }
);

CodeTabItem.displayName = "CodeTabItem";

export const CodeTabs = observer(() => {
  return (
    <ReactSortable
      // role="tablist"
      className="h-8 box-content border-b border-macaron-separator flex"
      list={codeEditorsState.openEditorStates.map((state) => ({
        id: state.code.id,
      }))}
      animation={150}
      setList={action((list: { id: string }[]) => {
        codeEditorsState.openIDs.replace(list.map((item) => item.id));
      })}
    >
      {codeEditorsState.openEditorStates.map((editor) => (
        <CodeTabItem editorState={editor} key={editor.path} />
      ))}
    </ReactSortable>
  );
});

CodeTabs.displayName = "CodeTabs";
