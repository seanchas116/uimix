import { computed, makeObservable, observable } from "mobx";
import * as Y from "yjs";
import { Document } from "../models/Document";
import { Project } from "../models/Project";
import { Selectable } from "../models/Selectable";
import { generateExampleNodes } from "../models/generateExampleNodes";
import { getIncrementalUniqueName } from "../utils/Name";

export class ProjectState {
  constructor() {
    const ydoc = new Y.Doc();
    const projectData = ydoc.getMap("project");

    this.project = new Project(projectData);
    this.document = this.project.getOrCreateDocument("Page 1");
    this.undoManager = new Y.UndoManager(projectData);
    generateExampleNodes(this.document);
    makeObservable(this);
  }

  readonly project: Project;
  @observable document: Document;

  readonly undoManager: Y.UndoManager;

  @computed get rootSelectable(): Selectable {
    return this.document.rootSelectable;
  }

  @computed get selectedSelectables(): Selectable[] {
    return this.rootSelectable.children.flatMap((s) => s.selectedDescendants);
  }

  readonly collapsedPaths = observable.set<string>();

  openDocument(path: string) {
    this.document = this.project.getOrCreateDocument(path);
  }

  createDocument(path: string) {
    const existingFilePaths = new Set(
      this.project.documents.map((d) => d.filePath)
    );
    const newPath = getIncrementalUniqueName(existingFilePaths, path);
    this.project.getOrCreateDocument(newPath);
    this.undoManager.stopCapturing();
  }

  deleteDocumentOrFolder(path: string) {
    const affectedDocuments = this.project.affectedDocumentsForPath(path);
    const deletingCurrent = affectedDocuments.includes(this.document);

    if (this.project.documentCount === affectedDocuments.length) {
      return;
    }
    this.project.deleteDocumentOrFolder(path);

    if (deletingCurrent) {
      this.document = this.project.documents[0];
    }

    this.undoManager.stopCapturing();
  }

  renameDocumentOrFolder(path: string, newPath: string) {
    const affectedDocuments = this.project.affectedDocumentsForPath(path);
    const renamingCurrent = affectedDocuments.includes(this.document);
    let newCurrentPath: string | undefined;
    if (renamingCurrent) {
      newCurrentPath = newPath + this.document.filePath.slice(path.length);
    }

    this.project.renameDocumentOrFolder(path, newPath);
    if (newCurrentPath) {
      this.document = this.project.getOrCreateDocument(newCurrentPath);
    }
    this.undoManager.stopCapturing();
  }
}

export const projectState = new ProjectState();
