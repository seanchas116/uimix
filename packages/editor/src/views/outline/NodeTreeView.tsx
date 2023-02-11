import { Icon } from "@iconify/react";
import { action, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { TreeView, TreeViewItem, TreeViewItemRow } from "react-draggable-tree";
import clsx from "clsx";
import widgetsIcon from "@iconify-icons/ic/widgets";
import outlineWidgetsIcon from "@iconify-icons/ic/outline-widgets";
import rectIcon from "@seanchas116/design-icons/json/rect.json";
import hStackIcon from "@seanchas116/design-icons/json/h-stack.json";
import vStackIcon from "@seanchas116/design-icons/json/v-stack.json";
import textIcon from "@seanchas116/design-icons/json/text.json";
import { moveSelectables, Selectable } from "../../models/Selectable";
import { projectState } from "../../state/ProjectState";
import { DoubleClickToEdit } from "../../components/DoubleClickToEdit";
import { commands } from "../../state/Commands";
import {
  DropBetweenIndicator,
  DropOverIndicator,
  ToggleCollapsedButton,
} from "../../components/TreeViewParts";
import { showContextMenu } from "../ContextMenu";
import { viewportState } from "../../state/ViewportState";
import { twMerge } from "tailwind-merge";
import { getIconAndTextForCondition } from "../inspector/style/ComponentPane";

interface NodeTreeViewItem extends TreeViewItem {
  selectable: Selectable;
}

function selectableToTreeViewItem(
  selectable: Selectable,
  parent?: NodeTreeViewItem
): NodeTreeViewItem {
  const item: NodeTreeViewItem = {
    key: selectable.id,
    parent,
    selectable,
    children: [],
  };
  if (!selectable.collapsed) {
    item.children = selectable.children.map((child) =>
      selectableToTreeViewItem(child, item)
    );
  }
  return item;
}

const TreeRow: React.FC<{
  rows: readonly TreeViewItemRow<NodeTreeViewItem>[];
  index: number;
  selectable: Selectable;
  depth: number;
  indentation: number;
}> = observer(({ rows, index, selectable, depth, indentation }) => {
  const onCollapsedChange = action((value: boolean) => {
    selectable.collapsed = value;
  });

  const onClick = action((event: React.MouseEvent<HTMLElement>) => {
    if (event.metaKey) {
      if (selectable.selected) {
        selectable.deselect();
      } else {
        selectable.select();
      }
    } else if (event.shiftKey) {
      let minSelectedIndex = index;
      let maxSelectedIndex = index;

      for (const [i, row] of rows.entries()) {
        if (row.item.selectable.selected) {
          minSelectedIndex = Math.min(minSelectedIndex, i);
          maxSelectedIndex = Math.max(maxSelectedIndex, i);
        }
      }

      for (let i = minSelectedIndex; i <= maxSelectedIndex; ++i) {
        rows[i].item.selectable.select();
      }
    } else {
      projectState.document.rootSelectable.deselect();
      selectable.select();
    }
  });

  const onMouseEnter = action(() => {
    viewportState.hoveredSelectable = selectable;
  });
  const onMouseLeave = action(() => {
    viewportState.hoveredSelectable = undefined;
  });

  const selected = selectable.selected;
  const hovered = viewportState.hoveredSelectable === selectable;
  const ancestorSelected = selectable.ancestorSelected;

  const topSelected =
    rows[index - 1]?.item.selectable.ancestorSelected ?? false;
  const bottomSelected =
    rows[index + 1]?.item.selectable.ancestorSelected ?? false;

  const isComponent = selectable.node.type === "component";

  const isInstance = selectable.originalNode.type === "instance";
  const isInsideInstance = selectable.idPath.length >= 2;

  const icon = (() => {
    if (isInstance) {
      return outlineWidgetsIcon;
    }

    switch (selectable.node.type) {
      default:
      case "frame": {
        const layout = selectable.style.layout;
        if (layout === "stack") {
          const dir = selectable.style.stackDirection;
          if (dir === "x") {
            return hStackIcon;
          } else {
            return vStackIcon;
          }
        }
        return rectIcon;
      }
      case "text":
        return textIcon;
      case "component":
        return widgetsIcon;
      case "instance":
        return outlineWidgetsIcon;
    }
  })();

  const onContextMenu = action((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    if (!selectable.selected) {
      projectState.document.rootSelectable.deselect();
      selectable.select();
    }

    showContextMenu(e, commands.contextMenuForSelectable(selectable));
  });

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={onContextMenu}
      className={clsx("w-full h-8 px-1")}
    >
      <div
        className={twMerge(
          "w-full h-8 flex items-center text-macaron-text",
          !topSelected && "rounded-t",
          !bottomSelected && "rounded-b",
          selected
            ? "bg-macaron-active text-macaron-activeText"
            : ancestorSelected
            ? "bg-macaron-active/10"
            : "bg-macaron-background",
          hovered && "ring-1 ring-inset ring-macaron-active"
        )}
        style={{
          paddingLeft: depth * indentation,
        }}
      >
        <ToggleCollapsedButton
          visible={selectable.children.length > 0}
          value={selectable.collapsed}
          onChange={onCollapsedChange}
        />
        {selectable.parent?.node.type === "component" ? (
          (() => {
            const { icon, text } = getIconAndTextForCondition(
              selectable.originalNode.type === "variant"
                ? selectable.originalNode.condition ?? { type: "default" }
                : { type: "default" }
            );

            return (
              <>
                <Icon
                  className={twMerge(
                    "mr-1.5 text-xs text-macaron-disabledText",
                    isComponent &&
                      !selected &&
                      "text-macaron-component opacity-100",
                    selected && "opacity-100 text-macaron-activeText"
                  )}
                  icon={icon}
                />
                <span>{text}</span>
              </>
            );
          })()
        ) : (
          <>
            <Icon
              className={twMerge(
                "mr-1.5 text-xs opacity-30",
                (isComponent || isInstance) &&
                  !selected &&
                  "text-macaron-component opacity-100",
                selected && "opacity-100"
              )}
              icon={icon}
            />
            <DoubleClickToEdit
              className={twMerge(
                "flex-1 h-full",
                isComponent && "font-semibold",
                isInsideInstance && "italic opacity-60"
              )}
              value={selectable.originalNode.name}
              onChange={action((name: string) => {
                selectable.originalNode.name = name;
                projectState.undoManager.stopCapturing();
              })}
            />
          </>
        )}
      </div>
    </div>
  );
});

export const NodeTreeView: React.FC = observer(() => {
  const rootItem = selectableToTreeViewItem(projectState.rootSelectable);

  return (
    <TreeView
      className="min-h-full treeview-root"
      rootItem={rootItem}
      background={
        <div
          style={{
            position: "absolute",
            inset: 0,
          }}
          onClick={action(() => {
            rootItem.selectable.deselect();
          })}
          onContextMenu={action((e) => {
            e.preventDefault();
            showContextMenu(
              e,
              commands.contextMenuForSelectable(projectState.rootSelectable)
            );
          })}
        />
      }
      dropBetweenIndicator={DropBetweenIndicator}
      dropOverIndicator={DropOverIndicator}
      handleDragStart={({ item }) => {
        // if (item.selectable.isVariant) {
        //   return false;
        // }

        if (!item.selectable.selected) {
          projectState.document.rootSelectable.deselect();
          item.selectable.select();
        }
        return true;
      }}
      canDrop={({ item, draggedItem }) => {
        return (
          !!draggedItem &&
          item.selectable.canInsertChild &&
          item.selectable.node.type !== "component"
        );
      }}
      handleDrop={({ item, draggedItem, before }) => {
        runInAction(() => {
          if (draggedItem) {
            moveSelectables(
              item.selectable,
              before?.selectable,
              projectState.selectedSelectables
            );
            projectState.undoManager.stopCapturing();
          }
        });
      }}
      renderRow={({ rows, index, item, depth, indentation }) => (
        <TreeRow
          rows={rows}
          index={index}
          selectable={item.selectable}
          depth={depth}
          indentation={indentation}
        />
      )}
    />
  );
});
