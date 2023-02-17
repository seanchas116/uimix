import { action, computed, runInAction } from "mobx";
import { isTextInput } from "../utils/Focus";
import { blobToDataURL, imageFromURL } from "../utils/Blob";
import { Shortcut } from "../utils/Shortcut";
import { Selectable } from "../models/Selectable";
import { exportToJSON as exportJSON, importJSON } from "./JSONExport";
import { viewportState } from "./ViewportState";
import { projectState } from "./ProjectState";
import { handleShortcut, MenuCommandDef, MenuItemDef } from "./MenuItemDef";
import { Clipboard } from "./Clipboard";
import { autoLayout, removeLayout } from "../services/AutoLayout";
import { createComponent } from "../services/CreateComponent";
import { toDocumentJSON } from "../models/Document";
import { DocumentHierarchyEntry } from "../models/Project";
import { posix as path } from "path-browserify";

class Commands {
  @computed get canUndo(): boolean {
    // TODO
    return true;
  }
  @computed get canRedo(): boolean {
    // TODO
    return true;
  }

  undo(): void {
    projectState.undoManager.undo();
  }
  redo(): void {
    projectState.undoManager.redo();
  }

  async cut() {
    throw new Error("Not implemented");
  }

  async copy() {
    // TODO: copy from instance contents
    const json = toDocumentJSON(projectState.selectedSelectables);
    await Clipboard.writeNodes(json);
  }

  async paste() {
    const data = await Clipboard.readNodes();

    runInAction(() => {
      const getInsertionTarget = () => {
        const defaultTarget = {
          parent: projectState.document.rootSelectable,
          index: projectState.document.rootSelectable.children.length,
        };

        const selectedSelectables = projectState.selectedSelectables;
        let lastSelectable: Selectable | undefined =
          selectedSelectables[selectedSelectables.length - 1];
        while (lastSelectable && lastSelectable.idPath.length > 1) {
          lastSelectable = lastSelectable.parent;
        }
        if (!lastSelectable) {
          return defaultTarget;
        }

        const parent = lastSelectable?.parent;
        if (!parent) {
          return defaultTarget;
        }

        const index = parent.children.indexOf(lastSelectable) + 1;
        return { parent, index };
      };

      const insertionTarget = getInsertionTarget();
      projectState.document.rootSelectable.deselect();
      const selectables = insertionTarget.parent.insert(
        insertionTarget.index,
        data.nodes
      );
      for (const [id, styleJSON] of Object.entries(data.styles)) {
        const selectable = projectState.project.getSelectable(id.split(":"));
        if (selectable) {
          selectable.selfStyle.loadJSON(styleJSON);
        }
      }
      for (const selectable of selectables) {
        selectable.select();
      }
    });
  }

  delete() {
    for (const selected of projectState.selectedSelectables) {
      if (selected.idPath.length === 1) {
        selected.originalNode.remove();
      } else {
        // TODO: hide?
      }
    }
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
      // TODO: image source
      // source: {
      //   dataURL: dataURL,
      //   width: image.width,
      //   height: image.height,
      // },
    };
  }

  autoLayout() {
    for (const selectable of projectState.selectedSelectables) {
      autoLayout(selectable);
    }
    projectState.undoManager.stopCapturing();
  }

  removeLayout() {
    for (const selectable of projectState.selectedSelectables) {
      removeLayout(selectable);
    }
    projectState.undoManager.stopCapturing();
  }

  createComponent() {
    for (const selectable of projectState.selectedSelectables) {
      createComponent(selectable);
    }
    projectState.undoManager.stopCapturing();
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

  contextMenuForFile(file: DocumentHierarchyEntry): MenuItemDef[] {
    if (file.type === "directory") {
      return [
        {
          type: "command",
          text: "New File",
          onClick: action(() => {
            const newPath = path.join(file.path, "Page 1");
            projectState.createDocument(newPath);
          }),
        },
        {
          type: "command",
          text: "Delete",
          disabled: projectState.project.documentCount === 1,
          onClick: action(() => {
            projectState.deleteDocumentOrFolder(file.path);
          }),
        },
      ];
    } else {
      return [
        {
          type: "command",
          text: "Delete",
          disabled: projectState.project.documentCount === 1,
          onClick: action(() => {
            projectState.deleteDocumentOrFolder(file.path);
          }),
        },
      ];
    }
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
