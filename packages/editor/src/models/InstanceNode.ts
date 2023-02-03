import { NodeBase } from "./NodeBase";
import { InstanceNodeData, NodeData } from "node-data";
import { observable } from "mobx";
import { Node } from "./Node";
import { serializeAllStyle } from "./Style";
import { Selectable } from "./Selectable";
import { ComponentNode } from "./ComponentNode";

export class InstanceNode extends NodeBase {
  constructor(id?: string) {
    super(id);
    this.watchPropChanges();
  }

  @observable componentID: string = "";

  get type(): "instance" {
    return "instance";
  }

  get canHaveChildren(): boolean {
    return false;
  }

  serialize(): InstanceNodeData {
    return {
      ...this.serializeCommonWithStyle((s) => serializeAllStyle(s)),
      // replace style that contains default values unnecessary for instance nodes with partial style data
      style: serializeAllStyle(Selectable.get(this).partialStyle),
      type: "instance",
      componentID: this.componentID,
    };
  }

  deserialize(data: NodeData): void {
    if (data.type !== "instance") {
      throw new Error("Invalid node type");
    }
    super.deserialize(data);
    this.componentID = data.componentID;
  }

  get component(): ComponentNode | undefined {
    const document = this.root;
    if (document.type !== "document") {
      return;
    }
    const component = document.getNodeForID(this.componentID);
    if (component?.type !== "component") {
      return;
    }
    return component;
  }

  get componentRootNode(): Node | undefined {
    return this.component?.firstChild;
  }
}
