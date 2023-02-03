import { observer } from "mobx-react-lite";
import { TreeView, TreeViewItem } from "react-draggable-tree";
import fileIcon from "@iconify-icons/ic/outline-insert-drive-file";
import folderIcon from "@iconify-icons/ic/folder";
import {
  DropBetweenIndicator,
  DropOverIndicator,
  ToggleCollapsedButton,
} from "../../components/TreeViewParts";
import { CodeHierarchyEntry } from "../../models/Code";
import { projectState } from "../../state/ProjectState";
import { Icon } from "@iconify/react";
import { action, runInAction } from "mobx";
import clsx from "clsx";
import { codeEditorsState } from "../../state/CodeEditorsState";
import { posix as path } from "path-browserify";
import { DoubleClickToEdit } from "../../components/DoubleClickToEdit";
import { commands } from "../../state/Commands";
import { showContextMenu } from "../ContextMenu";

interface CodeTreeViewItem extends TreeViewItem {
  entry: CodeHierarchyEntry;
}

function buildTreeViewItem(
  entry: CodeHierarchyEntry,
  parent?: CodeTreeViewItem
): CodeTreeViewItem {
  const treeViewItem: CodeTreeViewItem = {
    key: entry.path,
    parent,
    entry,
    children: [],
  };

  if (
    entry.type === "directory" &&
    !codeEditorsState.collapsedPaths.has(entry.path)
  ) {
    treeViewItem.children = entry.children.map((child) =>
      buildTreeViewItem(child, treeViewItem)
    );
  }

  return treeViewItem;
}

const CodeRow = observer(
  ({
    depth,
    indentation,
    item,
  }: {
    depth: number;
    indentation: number;
    item: CodeTreeViewItem;
  }) => {
    const { entry } = item;

    const selectedPath = codeEditorsState.activeEditorState?.code.path;

    const selected = selectedPath === entry.path;
    const ancestorSelected = selectedPath
      ? entry.path.startsWith(selectedPath + "/")
      : false;
    const collapsed = codeEditorsState.collapsedPaths.has(entry.path);

    const onClick = action(() => {
      if (entry.type === "file") {
        codeEditorsState.open(entry.code.id);
      }
    });
    const onCollapsedChange = action((value: boolean) => {
      if (value) {
        codeEditorsState.collapsedPaths.add(entry.path);
      } else {
        codeEditorsState.collapsedPaths.delete(entry.path);
      }
    });

    return (
      <div
        onClick={onClick}
        onContextMenu={action((e) => {
          e.preventDefault();
          showContextMenu(e, commands.contextMenuForFile(entry));
        })}
        className={clsx(
          "h-7 flex items-center text-macaron-text",
          selected
            ? "bg-macaron-active"
            : ancestorSelected
            ? "bg-macaron-active/20"
            : "bg-macaron-background",
          "hover:ring-1 hover:ring-inset hover:ring-macaron-active"
        )}
        style={{
          paddingLeft: depth * indentation,
        }}
      >
        <ToggleCollapsedButton
          visible={entry.type === "directory"}
          value={collapsed}
          onChange={onCollapsedChange}
        />
        {entry.type === "file" ? (
          <Icon icon={fileIcon} className="mr-1.5 text-macaron-disabledText" />
        ) : (
          <Icon icon={folderIcon} className="mr-1.5 text-blue-400" />
        )}
        <DoubleClickToEdit
          className={"flex-1 h-full"}
          value={entry.name}
          onChange={action((name: string) => {
            const newPath = path.join(path.dirname(entry.path), name);

            if (entry.type === "file") {
              entry.code.target = {
                type: "file",
                path: newPath,
              };
            } else {
              projectState.project.codes.renameDirectory(entry.path, newPath);
            }
          })}
        />
      </div>
    );
  }
);

export const CodeTreeView = observer(() => {
  const rootItem = buildTreeViewItem(projectState.project.codes.toHierarchy());

  return (
    <TreeView
      className="min-h-full treeview-root"
      rootItem={rootItem}
      background={
        <div
          className="absolute inset-0"
          onClick={action(() => {
            //state.selectedPath = undefined;
          })}
          onContextMenu={action((e) => {
            e.preventDefault();

            showContextMenu(e, commands.contextMenuForFile(rootItem.entry));
          })}
        />
      }
      dropBetweenIndicator={DropBetweenIndicator}
      dropOverIndicator={DropOverIndicator}
      renderRow={(props) => <CodeRow {...props} />}
      handleDragStart={() => {
        return true;
      }}
      canDrop={({ item, draggedItem }) => {
        return !!draggedItem && item.entry.type === "directory";
      }}
      handleDrop={({ item, draggedItem }) => {
        runInAction(() => {
          if (draggedItem) {
            const entry = draggedItem.entry;
            const newDir = item.entry.path;
            const oldName = draggedItem.entry.name;
            const newPath = path.join(newDir, oldName);

            if (entry.type === "file") {
              entry.code.target = {
                type: "file",
                path: newPath,
              };
            } else {
              projectState.project.codes.renameDirectory(entry.path, newPath);
            }
          }
        });
      }}
      nonReorderable
    />
  );
});

CodeTreeView.displayName = "CodeTreeView";
