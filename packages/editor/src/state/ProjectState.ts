import { computed, makeObservable, observable } from "mobx";
import { History } from "../models/History";
import { Selectable } from "../models/Selectable";
import { Project, ProjectJSON } from "../models/Project";
import { generateExampleNodes } from "./generateExampleNodes";

export class ProjectState {
  constructor() {
    this.history = new History(this.document, {
      shouldIgnoreChanges: () => this.project.duringRemoteUpdate,
    });

    makeObservable(this);

    generateExampleNodes(this.project.document);
  }

  toProjectJSON(): ProjectJSON {
    return this.project.toJSON();
  }

  loadProjectJSON(projectJSON: ProjectJSON) {
    this.project.loadJSON(projectJSON);
    this.history.clear();
  }

  @observable fileName = "Untitled"; // TODO

  readonly project = new Project();

  @observable loaded = false;

  get document() {
    return this.project.document;
  }

  @observable.ref history: History;

  get rootSelectable(): Selectable {
    return Selectable.get(this.document);
  }

  @computed get selectedSelectables(): Selectable[] {
    return this.rootSelectable.children.flatMap((s) => s.selectedDescendants);
  }
}

export const projectState = new ProjectState();
