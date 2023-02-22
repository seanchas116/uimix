import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from "mobx";
import * as Y from "yjs";
import { Project } from "../models/Project";
import { Selectable } from "../models/Selectable";
import { generateExampleNodes } from "../models/generateExampleNodes";
import { getIncrementalUniqueName } from "../utils/Name";
import { trpc } from "./trpc";
import { debounce } from "lodash-es";
import { ProjectJSON } from "@uimix/node-data";
import { Node } from "../models/Node";

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
    this.page = this.project.nodes.create("page");
    this.page.name = "Page 1";
    this.project.node.append([this.page]);
    this.undoManager = new Y.UndoManager(projectData);
    generateExampleNodes(this.page);
    makeObservable(this);

    void this.load();
  }

  private saveLater = debounce(() => {
    this.save();
  }, 500);

  private async save() {
    console.log("save");
    await trpc?.save.mutate({ project: this.project.toJSON() });
  }

  @observable private _loading = true;

  get loading() {
    return this._loading;
  }

  private async load() {
    if (!trpc) {
      return;
    }

    const project = await trpc.load.query();
    console.log(project);

    runInAction(() => {
      this.loadJSON(project);
      this._loading = false;
    });

    trpc.onChange.subscribe(undefined, {
      onData: action((projectJSON: ProjectJSON) => {
        console.log("received", projectJSON);
        this.loadJSON(projectJSON);
      }),
      onError: (err) => {
        console.error("error", err);
      },
    });
  }

  loadJSON(projectJSON: ProjectJSON) {
    try {
      this._loading = true;

      if (Object.keys(projectJSON.nodes).length) {
        this.project.loadJSON(projectJSON);
      } else {
        this.project.node.clear();
        this.page = this.project.nodes.create("page");
        this.page.name = "Page 1";
        this.project.node.append([this.page]);
      }
      // TODO: preserve current page
      this.page = this.project.pages.all[0];
    } finally {
      this._loading = false;
    }
  }

  readonly project: Project;
  @observable page: Node;

  readonly undoManager: Y.UndoManager;

  @computed get rootSelectable(): Selectable {
    return this.page.selectable;
  }

  @computed get selectedSelectables(): Selectable[] {
    return this.rootSelectable.children.flatMap((s) => s.selectedDescendants);
  }

  @computed get selectedNodes(): Node[] {
    const nodes: Node[] = [];
    for (const s of this.selectedSelectables) {
      if (s.idPath.length === 1) {
        nodes.push(s.originalNode);
      }
    }
    return nodes;
  }

  readonly collapsedPaths = observable.set<string>();

  openPage(page: Node) {
    this.page = page;
  }

  createPage(name: string) {
    const existingFilePaths = new Set(
      this.project.pages.all.map((d) => d.name)
    );
    const newPath = getIncrementalUniqueName(existingFilePaths, name);

    const page = this.project.nodes.create("page");
    page.name = newPath;
    this.project.node.append([page]);

    this.undoManager.stopCapturing();
  }

  deletePageOrPageFolder(path: string) {
    const affectedPages = this.project.pages.affectedPagesForPath(path);
    const deletingCurrent = affectedPages.includes(this.page);

    if (this.project.pages.count === affectedPages.length) {
      return;
    }
    this.project.pages.deletePageOrPageFolder(path);

    if (deletingCurrent) {
      this.page = this.project.pages.all[0];
    }

    this.undoManager.stopCapturing();
  }

  renamePageOrPageFolder(path: string, newPath: string) {
    this.project.pages.renamePageOrPageFolder(path, newPath);
    this.undoManager.stopCapturing();
  }
}

export const projectState = new ProjectState();
