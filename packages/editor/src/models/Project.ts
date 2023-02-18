/* eslint-disable @typescript-eslint/no-explicit-any */

import * as Y from "yjs";
import { posix as path } from "path-browserify";
import { getOrCreate } from "../state/Collection";
import { ObservableYMap } from "../utils/ObservableYMap";
import { Document } from "./Document";
import { Selectable } from "./Selectable";
import { ObservableMultiMap } from "../utils/ObservableMultiMap";
import { Node } from "./Node";
import { computed, makeObservable } from "mobx";

class Nodes {
  readonly nodes = new ObservableMultiMap<string, Node>();

  get(id: string): Node | undefined {
    const nodes = [...this.nodes.get(id)];
    return nodes[0];
  }

  getOrThrow(id: string): Node {
    const node = this.get(id);
    if (!node) {
      throw new Error(`Node with id ${id} not found`);
    }
    return node;
  }

  // do not call this directly
  add(node: Node) {
    this.nodes.set(node.id, node);
    for (const child of node.children) {
      this.add(child);
    }
  }

  // do not call this directly
  remove(node: Node) {
    this.nodes.deleteValue(node.id, node);
    for (const child of node.children) {
      this.remove(child);
    }
  }
}

class Selectables {
  constructor(project: Project, data: Y.Map<Y.Map<any>>) {
    this.project = project;
    this.selectablesData = data;
  }

  private readonly project: Project;
  private readonly selectablesData: Y.Map<Y.Map<any>>;
  private readonly selectablesCache = new WeakMap<Y.Map<any>, Selectable>();

  private getSelectableData(idPath: string[]): Y.Map<any> {
    const key = idPath.join(":");
    let data = this.selectablesData.get(key);
    if (data === undefined) {
      data = new Y.Map();
      this.selectablesData.set(key, data);
    }
    return data;
  }

  get(idPath: string[]): Selectable {
    const data = this.getSelectableData(idPath);
    return getOrCreate(this.selectablesCache, data, () => {
      return new Selectable(this.project, idPath, data);
    });
  }

  getForNode(node: Node): Selectable {
    return this.get([node.id]);
  }
}

export interface DocumentHierarchyDirectoryEntry {
  type: "directory";
  path: string;
  name: string;
  children: DocumentHierarchyEntry[];
}

export interface DocumentHierarchyDocumentEntry {
  type: "file";
  path: string;
  name: string;
  document: Document;
}

export type DocumentHierarchyEntry =
  | DocumentHierarchyDirectoryEntry
  | DocumentHierarchyDocumentEntry;

class Documents {
  constructor(project: Project, data: Y.Map<any>) {
    this.project = project;
    this.data = ObservableYMap.get(data);
    makeObservable(this);
  }

  readonly project: Project;
  private readonly data: ObservableYMap<any>; // file path => document data
  private readonly _documents = new Map<string, Document>(); // file path => document

  get all(): Document[] {
    return [...this.data].map(([filePath, data]) =>
      this.getForData(filePath, data)
    );
  }

  @computed get count(): number {
    return this.data.size;
  }

  private getForData(filePath: string, data: Y.Map<any>): Document {
    let document = this._documents.get(filePath);
    if (document === undefined) {
      document = new Document(this.project, filePath, data);
      this._documents.set(filePath, document);
    }
    return document;
  }

  getOrCreate(filePath: string): Document {
    const data = getOrCreate(this.data, filePath, () => new Y.Map<any>());
    return this.getForData(filePath, data);
  }

  toHierarchy(): DocumentHierarchyDirectoryEntry {
    const root: DocumentHierarchyDirectoryEntry = {
      type: "directory",
      name: "",
      path: "",
      children: [],
    };
    const parents = new Map<string, DocumentHierarchyDirectoryEntry>();
    parents.set("", root);

    const mkdirp = (segments: string[]): DocumentHierarchyDirectoryEntry => {
      if (segments.length === 0) {
        return root;
      }

      const existing = parents.get(segments.join("/"));
      if (existing) {
        return existing;
      }

      const parent = mkdirp(segments.slice(0, -1));
      const dir: DocumentHierarchyDirectoryEntry = {
        type: "directory",
        name: segments[segments.length - 1],
        path: segments.join("/"),
        children: [],
      };
      parent.children.push(dir);
      parents.set(segments.join("/"), dir);
      return dir;
    };

    const docs = Array.from(this.all);
    docs.sort((a, b) => a.filePath.localeCompare(b.filePath));

    for (const doc of docs) {
      const segments = doc.filePath.split(path.sep);
      const parent = mkdirp(segments.slice(0, -1));

      const item: DocumentHierarchyDocumentEntry = {
        type: "file",
        name: segments[segments.length - 1],
        path: doc.filePath,
        document: doc,
      };
      parent.children.push(item);
    }

    return root;
  }

  affectedDocumentsForPath(path: string): Document[] {
    return this.all.filter(
      (doc) => doc.filePath === path || doc.filePath.startsWith(path + "/")
    );
  }

  deleteDocumentOrFolder(path: string) {
    const documentsToDelete = this.affectedDocumentsForPath(path);

    for (const doc of documentsToDelete) {
      this.data.delete(doc.filePath);
      this._documents.delete(doc.filePath);
      this.project.nodes.remove(doc.root);
    }
  }

  renameDocumentOrFolder(path: string, newPath: string) {
    if (path === newPath) {
      return;
    }

    const documentsToDelete = this.affectedDocumentsForPath(path);

    const newPaths = documentsToDelete.map(
      (doc) => newPath + doc.filePath.slice(path.length)
    );

    for (const newPath of newPaths) {
      if (this.data.has(newPath)) {
        throw new Error(`Path ${newPath} already exists`);
      }
    }

    for (let i = 0; i < documentsToDelete.length; i++) {
      const doc = documentsToDelete[i];
      const json = doc.root.toJSON();
      this.data.delete(doc.filePath);
      this._documents.delete(doc.filePath);
      this.project.nodes.remove(doc.root);

      const newDoc = this.getOrCreate(newPaths[i]);
      newDoc.root.append(json.children ?? []);
    }
  }
}

export class Project {
  constructor(data: Y.Map<any>) {
    this.selectables = new Selectables(
      this,
      getOrCreate(data, "selectables", () => new Y.Map())
    );
    this.documents = new Documents(
      this,
      getOrCreate(data, "documents", () => new Y.Map())
    );
  }

  readonly nodes = new Nodes();
  readonly selectables: Selectables;
  readonly documents: Documents;
}
