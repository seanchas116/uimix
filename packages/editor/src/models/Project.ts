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

export class Project {
  constructor(data: Y.Map<any>) {
    this.documentsData = ObservableYMap.get(
      getOrCreate(data, "documents", () => new Y.Map())
    );
    this.selectablesData = getOrCreate(data, "selectables", () => new Y.Map());
    makeObservable(this);
  }

  getNodeByID(id: string): Node | undefined {
    const nodes = [...this.nodesForID.get(id)];
    return nodes[0];
  }

  getNodeByIDOrThrow(id: string): Node {
    const node = this.getNodeByID(id);
    if (node === undefined) {
      throw new Error(`Node with ID ${id} not found`);
    }
    return node;
  }

  readonly nodesForID = new ObservableMultiMap<string, Node>();

  onAddNode(node: Node) {
    this.nodesForID.set(node.id, node);
    for (const child of node.children) {
      this.onAddNode(child);
    }
  }

  onRemoveNode(node: Node) {
    this.nodesForID.deleteValue(node.id, node);
    for (const child of node.children) {
      this.onRemoveNode(child);
    }
  }

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

  getSelectable(idPath: string[]): Selectable {
    const data = this.getSelectableData(idPath);
    return getOrCreate(this.selectablesCache, data, () => {
      return new Selectable(this, idPath, data);
    });
  }

  getSelectableForNode(node: Node): Selectable {
    return this.getSelectable([node.id]);
  }

  private readonly documentsData: ObservableYMap<any>; // file path => document data
  private readonly _documents = new Map<string, Document>(); // file path => document

  get documents(): Document[] {
    return [...this.documentsData].map(([filePath, data]) =>
      this.getDocumentForData(filePath, data)
    );
  }

  @computed get documentCount(): number {
    return this.documentsData.size;
  }

  private getDocumentForData(filePath: string, data: Y.Map<any>): Document {
    let document = this._documents.get(filePath);
    if (document === undefined) {
      document = new Document(this, filePath, data);
      this._documents.set(filePath, document);
    }
    return document;
  }

  getOrCreateDocument(filePath: string): Document {
    const data = getOrCreate(
      this.documentsData,
      filePath,
      () => new Y.Map<any>()
    );
    return this.getDocumentForData(filePath, data);
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

    const docs = Array.from(this.documents);
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
    return this.documents.filter(
      (doc) => doc.filePath === path || doc.filePath.startsWith(path + "/")
    );
  }

  deleteDocumentOrFolder(path: string) {
    const documentsToDelete = this.affectedDocumentsForPath(path);

    for (const doc of documentsToDelete) {
      this.documentsData.delete(doc.filePath);
      this._documents.delete(doc.filePath);
      this.onRemoveNode(doc.root);
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
      if (this.documentsData.has(newPath)) {
        throw new Error(`Path ${newPath} already exists`);
      }
    }

    for (let i = 0; i < documentsToDelete.length; i++) {
      const doc = documentsToDelete[i];
      const json = doc.root.toJSON();
      this.documentsData.delete(doc.filePath);
      this._documents.delete(doc.filePath);
      this.onRemoveNode(doc.root);

      const newDoc = this.getOrCreateDocument(newPaths[i]);
      newDoc.root.append(json.children ?? []);
    }
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
