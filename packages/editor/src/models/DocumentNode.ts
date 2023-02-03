import { NodeData } from "node-data";
import { EventEmitter } from "../utils/EventEmitter";
import { ComponentNode } from "./ComponentNode";
import { FrameNode } from "./FrameNode";
import { GroupNode } from "./GroupNode";
import { ImageNode } from "./ImageNode";
import { InstanceNode } from "./InstanceNode";
import { Node } from "./Node";
import { NodeBase } from "./NodeBase";
import { ShapeNode } from "./ShapeNode";
import { StackNode } from "./StackNode";
import { TextNode } from "./TextNode";

export class DocumentNode extends NodeBase {
  constructor(id?: string) {
    super(id);
    this.watchPropChanges();
    this._nodes.set(this.id, this);
  }

  get type(): "document" {
    return "document";
  }

  get canHaveChildren(): boolean {
    return true;
  }

  private _nodes = new Map<string, Node>();
  get nodes(): ReadonlyMap<string, Node> {
    return this._nodes;
  }

  private _onNodeWillAdd = new EventEmitter<Node>();
  private _onNodeDidAdd = new EventEmitter<Node>();
  private _onNodeWillRemove = new EventEmitter<Node>();
  private _onNodeDidRemove = new EventEmitter<Node>();
  private _onNodeWillChange = new EventEmitter<Node>();
  private _onNodeDidChange = new EventEmitter<Node>();

  readonly onNodeWillAdd = this._onNodeWillAdd.event;
  readonly onNodeDidAdd = this._onNodeDidAdd.event;
  readonly onNodeWillRemove = this._onNodeWillRemove.event;
  readonly onNodeDidRemove = this._onNodeDidRemove.event;
  readonly onNodeWillChange = this._onNodeWillChange.event;
  readonly onNodeDidChange = this._onNodeDidChange.event;

  descendantWillAdd(node: Node) {
    this._onNodeWillAdd.emit(node);
  }

  descendantDidAdd(node: Node) {
    node.recursively((node) => {
      this._nodes.set(node.id, node);
    });
    this._onNodeDidAdd.emit(node);
  }

  descendantWillRemove(node: Node) {
    node.recursively((node) => {
      this._nodes.delete(node.id);
    });
    this._onNodeWillRemove.emit(node);
  }

  descendantDidRemove(node: Node) {
    this._onNodeDidRemove.emit(node);
  }

  descendantWillChange(node: Node) {
    this._onNodeWillChange.emit(node);
  }

  descendantDidChange(node: Node) {
    this._onNodeDidChange.emit(node);
  }

  getNodeForID(id: string): Node | undefined {
    return this._nodes.get(id);
  }

  createNode(type: NodeData["type"], id: string | undefined): Node {
    switch (type) {
      case "group":
        return new GroupNode(id);
      case "frame":
        return new FrameNode(id);
      case "stack":
        return new StackNode(id);
      case "text":
        return new TextNode(id);
      case "shape":
        return new ShapeNode(id);
      case "image":
        return new ImageNode(id);
      case "component":
        return new ComponentNode(id);
      case "instance":
        return new InstanceNode(id);
    }
  }

  getOrCreateNode(type: NodeData["type"], id: string): Node {
    return this.getNodeForID(id) ?? this.createNode(type, id);
  }

  serialize(): NodeData {
    throw new Error("DocumentNode cannot be serialized");
  }
}
