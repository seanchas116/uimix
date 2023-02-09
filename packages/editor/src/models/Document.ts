import * as Y from "yjs";
import { getOrCreate } from "../state/Collection";
import { generateID } from "../utils/ID";
import { ObservableMultiMap } from "../utils/ObservableMultiMap";
import { ObservableYMap } from "../utils/ObservableYMap";
import { Node, NodeJSON } from "./Node";
import { Selectable } from "./Selectable";
import { IStyle } from "./Style";

export interface DocumentJSON {
  nodes: NodeJSON[];
  styles: Record<string, Partial<IStyle>>;
}

export class Document {
  constructor(data: Y.Map<any>) {
    this.data = ObservableYMap.get(data);

    const rootData = getOrCreate(data, "root", () => new Y.Map()) as Y.Map<any>;
    if (!rootData.has("id")) {
      rootData.set("id", generateID());
      rootData.set("type", "root");
      rootData.set("children", new Y.Array());
    }

    this.root = new Node(this, undefined, rootData);
    this.selectablesData = getOrCreate(data, "selectables", () => new Y.Map());
    this.nodesForID.set(this.root.id, this.root);
  }

  readonly data: ObservableYMap<any>;
  readonly root: Node;

  get rootSelectable(): Selectable {
    return this.getSelectable([this.root.id]);
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

  toJSON(): DocumentJSON {
    return toDocumentJSON(this.rootSelectable.children);
  }

  loadJSON(json: DocumentJSON) {
    this.root.clear();
    this.root.append(json.nodes);
    for (const [id, style] of Object.entries(json.styles)) {
      const selectable = this.getSelectable(id.split(":"));
      selectable.selfStyle.loadJSON(style);
    }
  }
}

// TODO generate correctly from instance contents
export function toDocumentJSON(selectables: Selectable[]): DocumentJSON {
  const nodeJSONs: NodeJSON[] = [];
  const styles: Record<string, Partial<IStyle>> = {};

  const addStyleRecursively = (selectable: Selectable) => {
    styles[selectable.id] = selectable.selfStyle.toJSON();
    for (const child of selectable.children) {
      addStyleRecursively(child);
    }
  };

  for (const selected of selectables) {
    nodeJSONs.push(selected.originalNode.toJSON());
    addStyleRecursively(selected);
  }

  return {
    nodes: nodeJSONs,
    styles,
  };
}
