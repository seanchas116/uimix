/* eslint-disable import/no-unresolved */
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

// @ts-ignore
self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === "json") {
      return new jsonWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker();
    }
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

const backgroundColor = "#262626";

monaco.editor.defineTheme("my-theme", {
  base: "vs-dark",
  inherit: true,
  rules: [{ background: backgroundColor.slice(1), token: "" }],
  colors: {
    "editor.background": backgroundColor,
  },
});
monaco.editor.setTheme("my-theme");

monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  target: monaco.languages.typescript.ScriptTarget.ESNext,
  isolatedModules: true,
});
