import { compact } from "lodash-es";
import { computed, makeObservable, observable } from "mobx";
import { projectState } from "./ProjectState";
import { CodeEditorState } from "./CodeEditorState";

export class CodeEditorsState {
  constructor() {
    makeObservable(this);
    this.openIDs.push(...projectState.project.codes.codes.keys());
    this._activeID = this.openIDs[0];
  }

  readonly openIDs = observable.array<string>([]);
  @observable private _activeID: string | undefined = undefined;

  get activeID(): string | undefined {
    return this._activeID;
  }

  open(id: string | undefined) {
    if (id && !this.openIDs.includes(id)) {
      this.openIDs.push(id);
    }
    this._activeID = id;
  }

  close(id: string) {
    const index = this.openIDs.indexOf(id);
    if (index !== -1) {
      this.openIDs.splice(index, 1);
    }
    if (this.activeID === id) {
      this._activeID = this.openIDs[index] || this.openIDs[index - 1];
    }
  }

  @computed get openEditorStates(): readonly CodeEditorState[] {
    return compact(
      this.openIDs.map((id) => {
        const code = projectState.project.codes.getForID(id);
        if (code) {
          return CodeEditorState.get(code);
        }
      })
    );
  }

  @computed get activeEditorState(): CodeEditorState | undefined {
    if (!this.activeID) {
      return;
    }
    const activeCode = projectState.project.codes.getForID(this.activeID);
    if (!activeCode) {
      return;
    }
    return CodeEditorState.get(activeCode);
  }

  readonly collapsedPaths = observable.set<string>([]);
}

export const codeEditorsState = new CodeEditorsState();
