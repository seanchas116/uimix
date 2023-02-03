import { projectState } from "./ProjectState";
import { handleShortcut, MenuCommandDef, MenuItemDef } from "./MenuItemDef";
import { action, computed } from "mobx";
import { Selectable } from "../models/Selectable";
import { Shortcut } from "../utils/Shortcut";
import { InstanceNodeData, NodeHierarchyData } from "node-data";
import { Clipboard } from "./Clipboard";
import { autoLayout, removeLayout } from "../services/AutoLayout";
import { createComponent } from "../services/CreateComponent";
import { Node } from "../models/Node";
import { ComponentNode } from "../models/ComponentNode";
import { isTextInput } from "../utils/Focus";
import { blobToDataURL, imageFromURL } from "../utils/Blob";
import { generateID } from "../utils/ID";
import { exportToJSON as exportJSON, importJSON } from "./JSONExport";
import { viewportState } from "./ViewportState";

class Commands {
  @computed get canUndo(): boolean {
    return projectState.history.canUndo;
  }
  @computed get canRedo(): boolean {
    return projectState.history.canRedo;
  }

  undo(): void {
    projectState.history.undo();
  }
  redo(): void {
    projectState.history.redo();
  }

  async cut() {
    // TODO
  }

  async copy() {
    const serializeHierarchy = (node: Node): NodeHierarchyData => {
      let component: ComponentNode | undefined;
      if (node.type === "component") {
        component = node;
      } else if (node.parent?.type === "component") {
        // variant root
        component = node.parent;
      }

      if (component) {
        const instanceData: InstanceNodeData = {
          type: "instance",
          id: generateID(),
          name: component.name,
          index: 0,
          componentID: component.id,
          style: {},
          styleForVariant: {},
        };
        return {
          node: instanceData,
          children: [],
        };
      }

      return {
        node: node.serialize(),
        children: node.children.map(serializeHierarchy),
      };
    };

    const encoded = projectState.selectedSelectables.map((s) =>
      serializeHierarchy(s.node)
    );
    await Clipboard.writeNodes(encoded);
  }

  async paste() {
    const datas = await Clipboard.readNodes();

    const deserializeHierarchy = (data: NodeHierarchyData) => {
      const node = projectState.document.createNode(data.node.type, undefined);
      node.deserialize(data.node);
      const children = data.children.map(deserializeHierarchy);
      node.append(children);
      return node;
    };
    const nodes = datas.map(deserializeHierarchy);

    // insert
    projectState.document.append(nodes);

    projectState.rootSelectable.deselect();
    for (const node of nodes) {
      Selectable.get(node).select();
    }
    projectState.history.commit();
  }

  delete() {
    for (const selected of projectState.selectedSelectables) {
      selected.node.remove();
    }
    projectState.history.commit();
  }

  insertFrame() {
    viewportState.insertMode = { type: "frame" };
  }

  insertText() {
    viewportState.insertMode = { type: "text" };
  }

  async insertImage() {
    const imageFilePickerOptions = {
      types: [
        {
          description: "Images",
          accept: {
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
          },
        },
      ],
    };

    const [fileHandle] = await showOpenFilePicker(imageFilePickerOptions);
    const blob = await fileHandle.getFile();
    const dataURL = await blobToDataURL(blob);
    const image = await imageFromURL(dataURL);

    viewportState.insertMode = {
      type: "image",
      source: {
        dataURL: dataURL,
        width: image.width,
        height: image.height,
      },
    };
  }

  autoLayout() {
    for (const selectable of projectState.selectedSelectables) {
      autoLayout(selectable).select();
    }
    projectState.history.commit();
  }

  removeLayout() {
    for (const selectable of projectState.selectedSelectables) {
      removeLayout(selectable).select();
    }
    projectState.history.commit();
  }

  createComponent() {
    for (const selected of projectState.selectedSelectables) {
      const node = selected.node;
      if (node.ownerComponent) {
        continue;
      }

      createComponent(node);
    }
    projectState.history.commit();
  }

  readonly exportJSONCommand: MenuCommandDef = {
    type: "command",
    text: "Export JSON...",
    onClick: action(() => {
      void exportJSON();
    }),
  };

  readonly importJSONCommand: MenuCommandDef = {
    type: "command",
    text: "Import JSON...",
    onClick: action(() => {
      void importJSON();
    }),
  };

  readonly undoCommand: MenuCommandDef = {
    type: "command",
    text: "Undo",
    shortcut: new Shortcut(["Mod"], "KeyZ"),
    disabled: !this.canUndo,
    onClick: action(() => this.undo()),
  };
  readonly redoCommand: MenuCommandDef = {
    type: "command",
    text: "Redo",
    shortcut: new Shortcut(["Shift", "Mod"], "KeyZ"), // TODO: Mod+Y in Windows?
    disabled: !this.canRedo,
    onClick: action(() => this.redo()),
  };

  readonly cutCommand: MenuCommandDef = {
    type: "command",
    text: "Cut",
    shortcut: new Shortcut(["Mod"], "KeyX"),
    onClick: action(() => {
      void this.cut();
    }),
  };
  readonly copyCommand: MenuCommandDef = {
    type: "command",
    text: "Copy",
    shortcut: new Shortcut(["Mod"], "KeyC"),
    onClick: action(() => {
      void this.copy();
    }),
  };
  readonly pasteCommand: MenuCommandDef = {
    type: "command",
    text: "Paste",
    shortcut: new Shortcut(["Mod"], "KeyV"),
    onClick: action(() => {
      void this.paste();
    }),
  };
  readonly deleteCommand: MenuCommandDef = {
    type: "command",
    text: "Delete",
    onClick: action(() => {
      this.delete();
    }),
  };

  readonly insertFrameCommand: MenuCommandDef = {
    type: "command",
    text: "Frame",
    shortcut: new Shortcut([], "KeyF"),
    onClick: action(() => {
      this.insertFrame();
    }),
  };
  readonly insertTextCommand: MenuCommandDef = {
    type: "command",
    text: "Text",
    shortcut: new Shortcut([], "KeyT"),
    onClick: action(() => {
      this.insertText();
    }),
  };
  readonly insertImageCommand: MenuCommandDef = {
    type: "command",
    text: "Image",
    onClick: action(() => {
      this.insertImage();
    }),
  };

  readonly createComponentCommand: MenuCommandDef = {
    type: "command",
    text: "Create Component",
    shortcut: new Shortcut(["Mod", "Alt"], "KeyK"),
    onClick: action(() => {
      this.createComponent();
    }),
  };
  readonly autoLayoutCommand: MenuCommandDef = {
    type: "command",
    text: "Auto Layout",
    onClick: action(() => {
      this.autoLayout();
    }),
  };
  readonly removeLayoutCommand: MenuCommandDef = {
    type: "command",
    text: "Remove Layout",
    onClick: action(() => {
      this.removeLayout();
    }),
  };

  @computed get menu(): MenuItemDef[] {
    return [
      {
        type: "submenu",
        text: "File",
        children: [this.exportJSONCommand, this.importJSONCommand],
      },
      {
        type: "submenu",
        text: "Edit",
        children: [
          this.undoCommand,
          this.redoCommand,
          { type: "separator" },
          this.cutCommand,
          this.copyCommand,
          this.pasteCommand,
          this.deleteCommand,
        ],
      },
      {
        type: "submenu",
        text: "Create",
        children: [
          this.insertFrameCommand,
          this.insertTextCommand,
          this.insertImageCommand,
        ],
      },
      {
        type: "submenu",
        text: "Node",
        children: [
          this.createComponentCommand,
          { type: "separator" },
          this.autoLayoutCommand,
          this.removeLayoutCommand,
        ],
      },
    ];
  }

  contextMenuForSelectable(selectable: Selectable): MenuItemDef[] {
    if (selectable === projectState.rootSelectable) {
      return [this.pasteCommand];
    }

    return [
      this.cutCommand,
      this.copyCommand,
      this.pasteCommand,
      this.deleteCommand,
      { type: "separator" },
      this.createComponentCommand,
      { type: "separator" },
      this.autoLayoutCommand,
      this.removeLayoutCommand,
    ];
  }

  handleKeyDown(event: KeyboardEvent): boolean {
    if (event.key === " ") {
      viewportState.panMode = true;
    }

    if (
      event.ctrlKey ||
      event.metaKey ||
      !isTextInput(document.activeElement)
    ) {
      if (event.key === "Delete" || event.key === "Backspace") {
        this.delete();
        return true;
      }
      if (event.key === "Escape") {
        viewportState.insertMode = undefined;
        return true;
      }

      return handleShortcut(this.menu, event);
    }

    return false;
  }

  handleKeyUp(event: KeyboardEvent): void {
    if (event.key === " ") {
      viewportState.panMode = false;
    }
  }
}

export const commands = new Commands();
