import { computed, makeObservable } from "mobx";
import * as Y from "yjs";
import { Document } from "../models/Document";
import { Selectable } from "../models/Selectable";
import { generateExampleNodes } from "./generateExampleNodes2";

export class ProjectState {
  constructor() {
    const ydoc = new Y.Doc();
    const documentData = ydoc.getMap("document");
    this.document = new Document(documentData);
    this.undoManager = new Y.UndoManager(documentData);
    generateExampleNodes(this.document);
    makeObservable(this);
  }

  // TODO: undo/redo

  readonly document: Document;
  readonly undoManager: Y.UndoManager;

  @computed get rootSelectable(): Selectable {
    return this.document.getSelectable([this.document.root.id]);
  }

  @computed get selectedSelectables(): Selectable[] {
    return this.rootSelectable.children.flatMap((s) => s.selectedDescendants);
  }
}

export const projectState = new ProjectState();
