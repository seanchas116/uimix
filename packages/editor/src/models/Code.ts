import { makeObservable, observable } from "mobx";
import { EventEmitter } from "../utils/EventEmitter";
import { posix as path } from "path-browserify";
import { z } from "zod";
import { generateID } from "../utils/ID";

export const CodeTarget = z.union([
  z.object({
    // code is attached to a component (id == component ID)
    type: z.literal("component"),
  }),
  z.object({
    // code represents a file
    // multiple codes for the same file path can exist (to cope with collaborative renaming)
    type: z.literal("file"),
    path: z.string(),
  }),
]);
export type CodeTarget = z.infer<typeof CodeTarget>;

export const CodeData = z.object({
  id: z.string(),
  target: CodeTarget,
  content: z.string(),
});
export type CodeData = z.infer<typeof CodeData>;

export class Code {
  constructor(id: string, target: CodeTarget) {
    this.id = id;
    this.target = target;
    makeObservable(this);
  }

  readonly id: string;
  @observable content = "";
  @observable.ref target: CodeTarget;
  private readonly _onDidDispose = new EventEmitter();
  readonly onDidDispose = this._onDidDispose.event;

  get path(): string {
    if (this.target.type === "component") {
      return `components/${this.id}.tsx`;
    } else {
      return this.target.path;
    }
  }

  dispose(): void {
    this._onDidDispose.emit();
  }
}

export class CodeSet {
  private readonly _codes = observable.map<string, Code>();

  get codes(): ReadonlyMap<string, Code> {
    return this._codes;
  }

  create(id: string, target: CodeTarget): Code {
    const code = new Code(id, target);
    this._codes.set(code.id, code);
    return code;
  }

  createForFile(path: string): Code {
    return this.create(generateID(), {
      type: "file",
      path,
    });
  }

  createForComponent(componentID: string): Code {
    return this.create(componentID, {
      type: "component",
    });
  }

  getForID(id: string): Code | undefined {
    return this._codes.get(id);
  }

  renameDirectory(oldPath: string, newPath: string) {
    for (const code of this._codes.values()) {
      if (
        code.target.type === "file" &&
        code.target.path.startsWith(oldPath + "/")
      ) {
        const newFilePath = path.join(
          newPath,
          code.path.slice(oldPath.length + 1)
        );
        code.target = {
          type: "file",
          path: newFilePath,
        };
      }
    }
  }

  delete(id: string) {
    const code = this._codes.get(id);
    if (code) {
      code.dispose();
      this._codes.delete(id);
    }
  }

  deleteDirectory(path: string) {
    for (const code of this._codes.values()) {
      if (
        code.target.type === "file" &&
        code.target.path.startsWith(path + "/")
      ) {
        this.delete(code.id);
      }
    }
  }

  clear() {
    for (const code of this._codes.values()) {
      code.dispose();
    }
    this._codes.clear();
  }

  toHierarchy(): CodeHierarchyDirectory {
    const root: CodeHierarchyDirectory = {
      type: "directory",
      name: "",
      path: "",
      children: [],
    };
    const parents = new Map<string, CodeHierarchyDirectory>();
    parents.set("", root);

    const mkdirp = (segments: string[]): CodeHierarchyDirectory => {
      if (segments.length === 0) {
        return root;
      }

      const existing = parents.get(segments.join("/"));
      if (existing) {
        return existing;
      }

      const parent = mkdirp(segments.slice(0, -1));
      const dir: CodeHierarchyDirectory = {
        type: "directory",
        name: segments[segments.length - 1],
        path: segments.join("/"),
        children: [],
      };
      parent.children.push(dir);
      parents.set(segments.join("/"), dir);
      return dir;
    };

    const codes = Array.from(this._codes.values());
    codes.sort((a, b) => a.path.localeCompare(b.path));

    for (const code of codes) {
      const segments = code.path.split(path.sep);
      const parent = mkdirp(segments.slice(0, -1));

      const item: CodeHierarchyFile = {
        type: "file",
        name: segments[segments.length - 1],
        path: code.path,
        code,
      };
      parent.children.push(item);
    }

    return root;
  }
}

export interface CodeHierarchyDirectory {
  type: "directory";
  path: string;
  name: string;
  children: CodeHierarchyEntry[];
}

export interface CodeHierarchyFile {
  type: "file";
  path: string;
  name: string;
  code: Code;
}

export type CodeHierarchyEntry = CodeHierarchyDirectory | CodeHierarchyFile;
