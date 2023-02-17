import { posix as path } from "path-browserify";
import { action, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { twMerge } from "tailwind-merge";
import { TreeView, TreeViewItem } from "react-draggable-tree";
import { Icon } from "@iconify/react";
import fileIcon from "@iconify-icons/ic/outline-insert-drive-file";
import folderIcon from "@iconify-icons/ic/folder";
import {
  DropBetweenIndicator,
  DropOverIndicator,
  ToggleCollapsedButton,
} from "../../components/TreeViewParts";
import { projectState } from "../../state/ProjectState";
import { DoubleClickToEdit } from "../../components/DoubleClickToEdit";
import { commands } from "../../state/Commands";
import { DocumentHierarchyEntry } from "../../models/Project";
import { showContextMenu } from "../ContextMenu";

interface DocumentTreeViewItem extends TreeViewItem {
  entry: DocumentHierarchyEntry;
}

function buildTreeViewItem(
  entry: DocumentHierarchyEntry,
  parent?: DocumentTreeViewItem
): DocumentTreeViewItem {
  const treeViewItem: DocumentTreeViewItem = {
    key: entry.path,
    parent,
    entry,
    children: [],
  };

  if (
    entry.type === "directory" &&
    !projectState.collapsedPaths.has(entry.path)
  ) {
    treeViewItem.children = entry.children.map((child) =>
      buildTreeViewItem(child, treeViewItem)
    );
  }

  return treeViewItem;
}

const DocumentRow = observer(
  ({
    depth,
    indentation,
    item,
  }: {
    depth: number;
    indentation: number;
    item: DocumentTreeViewItem;
  }) => {
    const { entry } = item;

    const selected = projectState.document.filePath === entry.path;
    const collapsed = projectState.collapsedPaths.has(entry.path);

    const onClick = action(() => {
      if (entry.type === "file") {
        projectState.openDocument(entry.path);
      }
    });
    const onCollapsedChange = action((value: boolean) => {
      if (value) {
        projectState.collapsedPaths.add(entry.path);
      } else {
        projectState.collapsedPaths.delete(entry.path);
      }
    });

    return (
      <div
        onClick={onClick}
        onContextMenu={action((e) => {
          e.preventDefault();
          showContextMenu(e, commands.contextMenuForFile(entry));
        })}
        className="w-full h-8 px-1"
      >
        <div
          className={twMerge(
            "w-full h-8 flex items-center text-macaron-text rounded",
            selected
              ? "bg-macaron-active text-macaron-activeText"
              : "bg-macaron-background",
            entry.type === "file" &&
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
            <Icon
              icon={fileIcon}
              className={twMerge(
                "mr-1.5 text-macaron-disabledText",
                selected && "opacity-100 text-macaron-activeText"
              )}
            />
          ) : (
            <Icon icon={folderIcon} className="mr-1.5 text-blue-400" />
          )}
          <DoubleClickToEdit
            className={"flex-1 h-full"}
            value={entry.name}
            onChange={action((name: string) => {
              const newPath = path.join(path.dirname(entry.path), name);
              projectState.renameDocumentOrFolder(entry.path, newPath);
            })}
          />
        </div>
      </div>
    );
  }
);

export const DocumentTreeView = observer(() => {
  const rootItem = buildTreeViewItem(projectState.project.toHierarchy());

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
      renderRow={(props) => <DocumentRow {...props} />}
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

            projectState.renameDocumentOrFolder(entry.path, newPath);
          }
        });
      }}
      nonReorderable
    />
  );
});

DocumentTreeView.displayName = "DocumentTreeView";
