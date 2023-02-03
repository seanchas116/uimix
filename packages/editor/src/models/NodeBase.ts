import { computed, makeObservable, observable } from "mobx";
import { ObservableRBTree } from "../utils/ObservableRBTree";
import { NodeData, NodeBaseData } from "node-data";
import { Node } from "./Node";
import { deserializeStyle, IStyle } from "./Style";
import { Selectable } from "./Selectable";
import { ComponentNode } from "./ComponentNode";
import { generateID } from "../utils/ID";
import { ObservableChangeWatcher } from "../utils/ObservableChangeWatcher";

interface NodeKey {
  index: number;
  id: string;
}

function mix(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}

export abstract class NodeBase {
  readonly id: string;
  // TODO: use variable-length floating point numbers
  @observable private _index: number = 0;
  @observable private _parent: Node | undefined = undefined;

  @observable name = "Node";

  private childrenMap = new ObservableRBTree<NodeKey, Node>((a, b) => {
    if (a.index === b.index) {
      return a.id.localeCompare(b.id);
    }
    return a.index - b.index;
  });

  constructor(id?: string) {
    this.id = id ?? generateID();
    makeObservable(this);
  }

  abstract get type(): Node["type"];
  abstract get canHaveChildren(): boolean;

  get index(): number {
    return this._index;
  }

  get sortKey(): NodeKey {
    return { index: this._index, id: this.id };
  }

  get parent(): Node | undefined {
    return this._parent;
  }

  get ancestors(): Node[] {
    if (!this.parent) {
      return [this as Node];
    }
    return this.parent.ancestors.concat([this as Node]);
  }

  get root(): Node {
    return this._parent?.root ?? (this as Node);
  }

  get ownerComponent(): ComponentNode | undefined {
    const self = this as Node;
    if (self.type === "component") {
      return self;
    }
    return self.parent?.ownerComponent;
  }

  includes(node: Node): boolean {
    let current: Node | undefined = node;
    while (current) {
      if (current === this) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  reparent(parent: Node | undefined, index: number) {
    if (parent === this._parent && index === this._index) {
      return;
    }

    // if (parent && parent.includes(this)) {
    //   throw new Error("Cannot reparent a node into one of its descendants");
    // }

    this.remove();

    parent?.descendantWillAdd(this as Node);

    this._parent = parent;
    this._index = index;
    if (parent) {
      parent.childrenMap.set(this.sortKey, this as Node);
      parent.descendantDidAdd(this as Node);
    }
  }

  insertBefore(nodes: Node[], next: Node | undefined) {
    for (const node of nodes) {
      if (this === node) {
        return;
      }
      if (node.includes(this as Node)) {
        throw new Error("Cannot insert a node into one of its descendants");
      }
    }
    if (next && next._parent !== this) {
      throw new Error("Next node is not a child of this node");
    }

    const prev = next ? next.previousSibling : this.lastChild;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const index =
        prev && next
          ? mix(prev._index, next._index, (i + 1) / (nodes.length + 1))
          : prev
          ? prev._index + i + 1
          : next
          ? next._index - nodes.length + i
          : i;

      node.reparent(this as Node, index);
    }
  }

  append(nodes: Node[]) {
    this.insertBefore(nodes, undefined);
  }

  remove() {
    const parent = this._parent;
    if (!parent) {
      return;
    }

    (parent as NodeBase).descendantWillRemove(this as Node);

    parent.childrenMap.delete(this.sortKey);
    this._parent = undefined;
    this._index = 0;

    (parent as NodeBase).descendantDidRemove(this as Node);
  }

  @computed get children(): Node[] {
    return [...this.childrenMap.values()];
  }

  @computed get firstChild(): Node | undefined {
    return this.childrenMap.min()?.[1];
  }

  @computed get lastChild(): Node | undefined {
    return this.childrenMap.max()?.[1];
  }

  @computed get nextSibling(): Node | undefined {
    if (!this._parent) {
      return undefined;
    }
    return this._parent.childrenMap.next(this.sortKey)?.[1];
  }

  @computed get previousSibling(): Node | undefined {
    if (!this._parent) {
      return undefined;
    }
    return this._parent.childrenMap.prev(this.sortKey)?.[1];
  }

  recursively(callback: (node: Node) => void) {
    callback(this as Node);
    for (const child of this.children) {
      child.recursively(callback);
    }
  }

  protected serializeCommon(): NodeBaseData {
    return {
      id: this.id,
      parent: this._parent?.id,
      index: this._index,
      name: this.name,
    };
  }

  protected serializeCommonWithStyle<T>(
    serializeStyle: (style: IStyle) => T
  ): NodeBaseData & {
    style: T;
    styleForVariant: Record<string, Partial<T>>;
  } {
    const variants = this.ownerComponent?.variants ?? [];

    return {
      ...this.serializeCommon(),
      style: serializeStyle(Selectable.get(this as Node).style),
      styleForVariant: Object.fromEntries(
        variants.map((variant) => [
          variant.id,
          serializeStyle(Selectable.get(this as Node, variant).style),
        ])
      ),
    };
  }

  abstract serialize(): NodeData;

  serializeAll(): NodeData[] {
    return [
      this.serialize(),
      ...this.children.flatMap((child) => child.serializeAll()),
    ];
  }

  deserializeAndReparent(
    data: NodeData,
    getParent: (parentID: string) => Node | undefined
  ) {
    if (this.id !== data.id) {
      throw new Error("Cannot deserialize node with different id");
    }

    if (this.parent?.id !== data.parent || this.index !== data.index) {
      const newParent = data.parent ? getParent(data.parent) : undefined;
      this.reparent(newParent, data.index);
    }

    this.deserialize(data);
  }

  deserialize(data: NodeData) {
    if ("style" in data) {
      deserializeStyle(
        Selectable.get(this as Node).partialStyle,
        data.style ?? {}
      );
    }
    if ("styleForVariant" in data) {
      const variants = this.ownerComponent?.variants ?? [];

      for (const [variantId, style] of Object.entries(data.styleForVariant)) {
        const variant = variants.find((variant) => variant.id === variantId);
        if (variant) {
          deserializeStyle(
            Selectable.get(this as Node, variant).partialStyle,
            style
          );
        }
      }
    }

    this.name = data.name;
  }

  notifyWillChange() {
    this.descendantWillChange(this as Node);
  }

  notifyDidChange() {
    this.descendantDidChange(this as Node);
  }

  descendantWillAdd(node: Node) {
    this.parent?.descendantWillAdd(node);
  }

  descendantDidAdd(node: Node) {
    this.parent?.descendantDidAdd(node);
  }

  descendantWillRemove(node: Node) {
    this.parent?.descendantWillRemove(node);
  }

  descendantDidRemove(node: Node) {
    this.parent?.descendantDidRemove(node);
  }

  descendantWillChange(node: Node) {
    this.parent?.descendantWillChange(node);
  }

  descendantDidChange(node: Node) {
    this.parent?.descendantDidChange(node);
  }

  protected watchPropChanges() {
    new ObservableChangeWatcher(
      this,
      () => this.notifyWillChange(),
      () => this.notifyDidChange()
    );
  }
}
