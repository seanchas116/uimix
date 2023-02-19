import prettier from "prettier/standalone.js";
import parserBabel from "prettier/parser-babel.js";
import * as fs from "fs";
import glob from "glob";
import { TypedEmitter } from "tiny-typed-emitter";
import chokidar from "chokidar";
import { DocumentJSON, ProjectJSON } from "@uimix/node-data";
import path from "path";
import { isEqual } from "lodash-es";

function formatJSON(text: string): string {
  return prettier.format(text, {
    parser: "json",
    plugins: [parserBabel],
  });
}

const fileSuffix = ".uimix";

const ee = new TypedEmitter<{
  change: (project: ProjectJSON) => void;
}>();

export class FileController {
  constructor(options: { projectPath: string }) {
    this.cwd = options.projectPath;
    const watcher = chokidar.watch(`**/*${fileSuffix}`, {
      cwd: this.cwd,
    });
    watcher
      .on("add", (path) => {
        try {
          if (!path.endsWith(fileSuffix)) {
            return;
          }
          console.log(`File ${path} has been added`);
          this.filePaths.add(path);
          this.emitChange();
        } catch (e) {
          console.error(e);
        }
      })
      .on("change", (path) => {
        try {
          console.log(`File ${path} has been changed`);
          this.emitChange();
        } catch (e) {
          console.error(e);
        }
      })
      .on("unlink", (path) => {
        try {
          console.log(`File ${path} has been removed`);
          this.filePaths.delete(path);
          this.emitChange();
        } catch (e) {
          console.error(e);
        }
      });
  }

  readonly cwd: string;
  private readonly filePaths = new Set<string>();
  private lastSavedProject: ProjectJSON | undefined = undefined;

  private emitChange() {
    const project = this.load();
    if (this.lastSavedProject && isEqual(project, this.lastSavedProject)) {
      return;
    }

    console.log("emitChange", Object.keys(project.documents));
    ee.emit("change", project);
  }

  save(project: ProjectJSON) {
    this.lastSavedProject = project;

    const newFilePaths = new Set<string>(
      Object.keys(project.documents).map((name) => name + fileSuffix)
    );

    for (const filePath of this.filePaths) {
      if (!newFilePaths.has(filePath)) {
        fs.unlinkSync(path.resolve(this.cwd, filePath));
      }
    }

    for (const [name, data] of Object.entries(project.documents)) {
      fs.writeFileSync(
        path.resolve(this.cwd, name + fileSuffix),
        formatJSON(JSON.stringify(data))
      );
    }
  }

  load(): ProjectJSON {
    const filePaths = glob.sync(`**/*${fileSuffix}`, {
      cwd: this.cwd,
    });

    const documents: [string, DocumentJSON][] = [];
    for (const file of filePaths) {
      try {
        const data = fs.readFileSync(path.resolve(this.cwd, file), "utf8");
        documents.push([
          file.slice(0, -fileSuffix.length),
          DocumentJSON.parse(JSON.parse(data)),
        ]);
      } catch (e) {
        console.error(e);
      }
    }

    return {
      documents: Object.fromEntries(documents),
    };
  }

  onChange(cb: (projectJSON: ProjectJSON) => void): () => void {
    ee.on("change", cb);
    return () => {
      ee.off("change", cb);
    };
  }
}
