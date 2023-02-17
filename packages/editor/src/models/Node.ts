import { computed, makeObservable, observable } from "mobx";
import { ObservableYMap } from "../utils/ObservableYMap";
import { Document } from "./Document";
import * as Y from "yjs";
import { generateID } from "../utils/ID";
import { getOrCreate } from "../state/Collection";
import { NodeJSON, NodeType, VariantCondition } from "uimix-node-data";

export const abstractNodeTypes: NodeType[] = ["component"];

export class Node {
  constructor(document: Document, parent: Node | undefined, data: Y.Map<any>) {
    this.document = document;
    this.data = ObservableYMap.get(data);
    this.id = getOrCreate(data, "id", () => generateID());
    this.type = getOrCreate(data, "type", () => "frame");
    this.childrenData = getOrCreate(data, "children", () => new Y.Array<any>());
    this.parent = parent;

    const onChildrenChange = () => {
      const oldChildren = new Map<Y.Map<any>, Node>();
      for (const instance of this.children) {
        oldChildren.set(instance.data.y, instance);
      }
      const removedChildren = new Set<Node>(this.children);
      const newChildren: Node[] = [];
      const addedChildren: Node[] = [];

      for (const [i, nodeData] of [...this.childrenData].entries()) {
        let node = oldChildren.get(nodeData);
        if (node) {
          removedChildren.delete(node);
        } else {
          node = new Node(document, this, nodeData);
          addedChildren.push(node);
        }
        node.index = i;
        newChildren.push(node);
        oldChildren.delete(nodeData);
      }

      for (const removed of removedChildren) {
        document.onRemoveNode(removed);
      }

      for (const added of addedChildren) {
        document.onAddNode(added);
      }

      this.children = newChildren;
    };

    this.childrenData.observe(onChildrenChange);
    onChildrenChange();

    makeObservable(this);
  }

  readonly document: Document;
  readonly data: ObservableYMap<any>;
  readonly childrenData: Y.Array<any>;
  readonly id: string;
  readonly type: NodeType;
  readonly parent: Node | undefined;
  @observable index = 0;
  @observable.ref children: readonly Node[] = [];

  @computed get name(): string {
    return getOrCreate(this.data, "name", () => "");
  }

  set name(name: string) {
    this.data.set("name", name);
  }

  // Applicable only to variant nodes

  @computed get condition(): VariantCondition | undefined {
    return getOrCreate(this.data, "condition", () => undefined);
  }

  set condition(selector: VariantCondition | undefined) {
    this.data.set("condition", selector);
  }

  @computed get childCount(): number {
    return this.children.length;
  }

  canInsert(type: NodeType): boolean {
    if (this.type === "component") {
      if (this.children.length === 0) {
        return type !== "variant";
      } else {
        return type === "variant";
      }
    }

    if (this.type === "root") {
      const allowed: NodeType[] = ["frame", "text", "component", "instance"];
      return allowed.includes(type);
    }

    if (this.type === "frame") {
      const allowed: NodeType[] = ["frame", "text", "instance"];
      return allowed.includes(type);
    }

    return false;
  }

  insert(index: number, contents: Omit<NodeJSON, "id">[]): Node[] {
    for (let i = 0; i < contents.length; i++) {
      if (!this.canInsert(contents[i].type)) {
        throw new Error("Cannot insert node of type " + contents[i].type);
      }
    }

    this.childrenData.insert(
      index,
      contents.map((content) => {
        return Node.dataFromJSON(content);
      })
    );

    return this.children.slice(index, index + contents.length);
  }

  prepend(contents: Omit<NodeJSON, "id">[]): Node[] {
    return this.insert(0, contents);
  }

  append(contents: Omit<NodeJSON, "id">[]): Node[] {
    return this.insert(this.children.length, contents);
  }

  delete(index: number, length: number): void {
    this.childrenData.delete(index, length);
  }

  clear(): void {
    this.childrenData.delete(0, this.childrenData.length);
  }

  remove() {
    this.parent?.delete(this.index, 1);
  }

  toJSON(): NodeJSON {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      condition: this.condition,
      children: this.children.map((child) => child.toJSON()),
    };
  }

  static dataFromJSON(json: NodeJSON): Y.Map<any> {
    const children = new Y.Array();
    const childDatas =
      json.children?.map((child) => Node.dataFromJSON(child)) ?? [];
    children.insert(0, childDatas);

    const map = new Y.Map();
    map.set("id", json.id ?? generateID());
    map.set("name", json.name ?? "");
    map.set("type", json.type);
    if (json.condition) {
      map.set("condition", json.condition);
    }
    map.set("children", children);

    return map;
  }

  get isComponentRoot(): boolean {
    return this.parent?.type === "component" && this.type !== "variant";
  }

  get isVariant(): boolean {
    return this.parent?.type === "component" && this.type === "variant";
  }

  get ownerComponent(): Node | undefined {
    if (this.type === "component") {
      return this;
    }
    return this.parent?.ownerComponent;
  }
}
