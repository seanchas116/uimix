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
    this.document = this.project.documents.getOrCreate("Page 1");
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
    this.document = this.project.documents.getOrCreate(path);
  }

  createDocument(path: string) {
    const existingFilePaths = new Set(
      this.project.documents.all.map((d) => d.filePath)
    );
    const newPath = getIncrementalUniqueName(existingFilePaths, path);
    this.project.documents.getOrCreate(newPath);
    this.undoManager.stopCapturing();
  }

  deleteDocumentOrFolder(path: string) {
    const affectedDocuments =
      this.project.documents.affectedDocumentsForPath(path);
    const deletingCurrent = affectedDocuments.includes(this.document);

    if (this.project.documents.count === affectedDocuments.length) {
      return;
    }
    this.project.documents.deleteDocumentOrFolder(path);

    if (deletingCurrent) {
      this.document = this.project.documents.all[0];
    }

    this.undoManager.stopCapturing();
  }

  renameDocumentOrFolder(path: string, newPath: string) {
    const affectedDocuments =
      this.project.documents.affectedDocumentsForPath(path);
    const renamingCurrent = affectedDocuments.includes(this.document);
    let newCurrentPath: string | undefined;
    if (renamingCurrent) {
      newCurrentPath = newPath + this.document.filePath.slice(path.length);
    }

    this.project.documents.renameDocumentOrFolder(path, newPath);
    if (newCurrentPath) {
      this.document = this.project.documents.getOrCreate(newCurrentPath);
    }
    this.undoManager.stopCapturing();
  }
}

export const projectState = new ProjectState();
