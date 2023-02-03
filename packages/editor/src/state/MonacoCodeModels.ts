import { Project } from "../models/Project";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import "./monacoConfig";
import { action, observable, observe, reaction } from "mobx";
import { DisposeBag } from "../utils/DisposeBag";
import { projectState } from "./ProjectState";

export class MonacoCodeModels {
  constructor(project: Project) {
    this.project = project;

    reaction(
      () => [...project.codes.codes.values()],
      action((codes) => {
        console.log("dispose all", [...this.models]);
        for (const model of this.models.values()) {
          model.dispose();
        }
        this.models.clear();

        for (const code of codes) {
          if (this.models.has(code.path)) {
            // ignore codes with duplicate paths
            continue;
          }

          const model = monaco.editor.createModel(
            code.content,
            "typescript",
            monaco.Uri.parse(`file:///${code.path}.ts`)
          );

          const disposeBag = new DisposeBag();
          disposeBag.add(
            model.onDidChangeContent((e) => {
              if (!e.isFlush) {
                code.content = model.getValue();
              }
            }),
            observe(code, "content", () => {
              model.setValue(code.content);
            })
          );
          model.onWillDispose(() => disposeBag.dispose());

          this.models.set(code.path, model);
        }
      }),
      {
        fireImmediately: true,
      }
    );
  }

  readonly project: Project;
  readonly models = observable.map<string, monaco.editor.ITextModel>();
}

export const monacoCodeModels = new MonacoCodeModels(projectState.project);
