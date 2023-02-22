import prettier from "prettier/standalone.js";
import parserBabel from "prettier/parser-babel.js";
import * as fs from "fs";
import { TypedEmitter } from "tiny-typed-emitter";
import chokidar from "chokidar";
import path from "path";
import { isEqual } from "lodash-es";
import { mkdirp } from "mkdirp";
import { ProjectJSON } from "@uimix/node-data";
import dataUriToBuffer from "data-uri-to-buffer";
import { ImageEntry } from "../types.js";

function formatJSON(text: string): string {
  return prettier.format(text, {
    parser: "json",
    plugins: [parserBabel],
  });
}

const ee = new TypedEmitter<{
  change: (data: ProjectJSON) => void;
  imageAdded: (entry: ImageEntry) => void;
}>();

const jsonPath = "uimix/data.json";

export class ProjectController {
  constructor(options: { projectPath: string }) {
    this.cwd = options.projectPath;
    const jsonWatcher = chokidar.watch(jsonPath, {
      cwd: this.cwd,
    });
    jsonWatcher.on("change", (path) => {
      try {
        console.log(`File ${path} has been changed`);
        this.emitChange();
      } catch (e) {
        console.error(e);
      }
    });

    const imageWatcher = chokidar.watch(`uimix/images/*`, {
      cwd: this.cwd,
    });
    imageWatcher.on("add", (filePath) => {
      console.log(`File ${filePath} has been added`);
      ee.emit("imageAdded", this.imageForPath(filePath));
      this.imageFilePath.add(filePath);
    });
    imageWatcher.on("unlink", (filePath) => {
      console.log(`File ${filePath} has been removed`);
      this.imageFilePath.delete(filePath);
    });
  }

  readonly imageFilePath = new Set<string>();

  private imageForPath(filePath: string): {
    hash: string;
    dataURL: string;
  } {
    const extname = path.extname(filePath);
    const hash = path.basename(filePath).slice(0, -extname.length);
    const mimeType = `image/${extname.slice(1)}`;
    const data = fs.readFileSync(path.resolve(this.cwd, filePath));
    const dataURL = `data:${mimeType};base64,${data.toString("base64")}`;

    return {
      hash,
      dataURL,
    };
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

  onImageAdded(cb: (image: ImageEntry) => void): () => void {
    for (const filePath of this.imageFilePath) {
      cb(this.imageForPath(filePath));
    }

    ee.on("imageAdded", cb);
    return () => {
      ee.off("imageAdded", cb);
    };
  }

  insertImage(entry: ImageEntry) {
    const buffer = dataUriToBuffer(entry.dataURL);
    let extension: string = "";
    switch (buffer.type) {
      case "image/png":
        extension = "png";
        break;
      case "image/jpeg":
        extension = "jpeg";
        break;
      case "image/gif":
        extension = "gif";
        break;
      default:
        throw new Error(`Unsupported image type: ${buffer.type}`);
    }

    mkdirp.sync(path.resolve(this.cwd, "uimix/images"));
    fs.writeFileSync(
      path.resolve(this.cwd, `uimix/images/${entry.hash}.${extension}`),
      buffer
    );
  }
}
