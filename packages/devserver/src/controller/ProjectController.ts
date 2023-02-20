import prettier from "prettier/standalone.js";
import parserBabel from "prettier/parser-babel.js";
import * as fs from "fs";
import { TypedEmitter } from "tiny-typed-emitter";
import chokidar from "chokidar";
import path from "path";
import { isEqual } from "lodash-es";
import { mkdirp } from "mkdirp";
import { ProjectJSON } from "@uimix/node-data";

function formatJSON(text: string): string {
  return prettier.format(text, {
    parser: "json",
    plugins: [parserBabel],
  });
}

const ee = new TypedEmitter<{
  change: (data: ProjectJSON) => void;
}>();

const jsonPath = "uimix/data.json";

export class ProjectController {
  constructor(options: { projectPath: string }) {
    this.cwd = options.projectPath;
    const watcher = chokidar.watch(jsonPath, {
      cwd: this.cwd,
    });
    watcher.on("change", (path) => {
      try {
        console.log(`File ${path} has been changed`);
        this.emitChange();
      } catch (e) {
        console.error(e);
      }
    });
  }

  readonly cwd: string;
  private lastSavedData: ProjectJSON | undefined = undefined;

  private emitChange() {
    const data = this.load();
    if (this.lastSavedData && isEqual(data, this.lastSavedData)) {
      return;
    }

    ee.emit("change", data);
  }

  save(data: ProjectJSON) {
    this.lastSavedData = data;
    mkdirp.sync(path.resolve(this.cwd, "uimix"));

    fs.writeFileSync(
      path.resolve(this.cwd, jsonPath),
      formatJSON(JSON.stringify(data))
    );
  }

  load(): ProjectJSON {
    try {
      const data = fs.readFileSync(path.resolve(this.cwd, jsonPath), "utf8");
      return ProjectJSON.parse(JSON.parse(data));
    } catch (e) {
      console.error(e);
      return {
        nodes: {},
        styles: {},
      };
    }
  }

  onChange(cb: (data: ProjectJSON) => void): () => void {
    ee.on("change", cb);
    return () => {
      ee.off("change", cb);
    };
  }
}
