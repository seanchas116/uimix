import { computed, makeObservable } from "mobx";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { posix as path } from "path-browserify";
import { Code } from "../models/Code";
import { DisposeBag } from "../utils/DisposeBag";
import { projectState } from "./ProjectState";
import { monacoCodeModels } from "./MonacoCodeModels";
import "./monacoConfig";

type Source =
  | {
      type: "component";
      id: string;
    }
  | {
      type: "file";
      path: string;
    };

const instances = new WeakMap<Code, CodeEditorState>();

export class CodeEditorState {
  static get(code: Code) {
    let instance = instances.get(code);
    if (!instance) {
      instance = new CodeEditorState(code);
      instances.set(code, instance);
    }
    return instance;
  }

  private constructor(code: Code) {
    this.code = code;

    makeObservable(this);

    this.code.onDidDispose(() => {
      this.dispose();
    });
  }

  readonly code: Code;
  private disposeBag = new DisposeBag();

  get source(): Source {
    if (this.path.startsWith("components/")) {
      const componentID = this.path.slice("components/".length, -".tsx".length);
      return {
        type: "component",
        id: componentID,
      };
    } else {
      return {
        type: "file",
        path: this.path,
      };
    }
  }

  get path() {
    return this.code.path;
  }

  @computed get model(): monaco.editor.ITextModel | undefined {
    return monacoCodeModels.models.get(this.code.path);
  }

  @computed get title(): string {
    if (this.source.type === "component") {
      console.log(this.source);
      const componentNode = projectState.project.document.getNodeForID(
        this.source.id
      );
      if (componentNode) {
        return componentNode.name;
      }
      return "Unknown component";
    }
    return path.basename(this.source.path);
  }

  dispose(): void {
    this.disposeBag.dispose();
  }
}
