import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from "mobx";
import * as Y from "yjs";
import { Document } from "../models/Document";
import { Project } from "../models/Project";
import { Selectable } from "../models/Selectable";
import { generateExampleNodes } from "../models/generateExampleNodes";
import { getIncrementalUniqueName } from "../utils/Name";
import { trpc } from "./trpc";
import { debounce } from "lodash-es";
import { ProjectJSON } from "@uimix/node-data";

export class ProjectState {
  constructor() {
    const ydoc = new Y.Doc();
    const projectData = ydoc.getMap("project");

    projectData.observeDeep(() => {
      if (this._loading) {
        return;
      }
      this.saveLater();
    });

    this.project = new Project(projectData);
    this.document = this.project.documents.getOrCreate("Page 1");
    this.undoManager = new Y.UndoManager(projectData);
    generateExampleNodes(this.document);
    makeObservable(this);

    void this.load();
  }

  private saveLater = debounce(() => {
    this.save();
  }, 500);

  private async save() {
    console.log("save");

    const projectJSON: ProjectJSON = {
      documents: {},
    };

    for (const document of this.project.documents.all) {
      projectJSON.documents[document.filePath] = document.toJSON();
    }

    await trpc.save.mutate({ project: projectJSON });
  }

  @observable private _loading = true;

  get loading() {
    return this._loading;
  }

  private async load() {
    const project = await trpc.load.query();
    console.log(project);

    runInAction(() => {
      if (Object.keys(project.documents).length !== 0) {
        this.loadProjectJSON(project);
      }
      this._loading = false;
    });

    trpc.onChange.subscribe(undefined, {
      onData: action((projectJSON: ProjectJSON) => {
        console.log("received", projectJSON);
        this.loadProjectJSON(projectJSON);
      }),
      onError: (err) => {
        console.error("error", err);
      },
    });
  }

  private loadProjectJSON(projectJSON: ProjectJSON) {
    try {
      this._loading = true;

      const selectedName = this.document.filePath;

      const removedPaths = new Set(
        this.project.documents.all.map((d) => d.filePath)
      );
      for (const filePath of Object.keys(projectJSON.documents)) {
        removedPaths.delete(filePath);
      }

      for (const [path, data] of Object.entries(projectJSON.documents)) {
        const doc = this.project.documents.getOrCreate(path);
        doc.loadJSON(data);
      }
      for (const removed of removedPaths) {
        this.project.documents.deleteDocumentOrFolder(removed);
      }

      const documents = this.project.documents.all;
      const document =
        documents.find((d) => d.filePath === selectedName) || documents[0];

      this.document = document;
    } finally {
      this._loading = false;
    }
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
