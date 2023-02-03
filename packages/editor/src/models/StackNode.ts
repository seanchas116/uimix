import { NodeData, StackNodeData } from "node-data";
import { NodeBase } from "./NodeBase";
import { serializeStackStyle } from "./Style";

export class StackNode extends NodeBase {
  constructor(id?: string) {
    super(id);
    this.watchPropChanges();
  }

  get type(): "stack" {
    return "stack";
  }

  get canHaveChildren(): boolean {
    return true;
  }

  serialize(): StackNodeData {
    return {
      ...this.serializeCommonWithStyle((s) => serializeStackStyle(s)),
      type: "stack",
    };
  }

  deserialize(data: NodeData): void {
    if (data.type !== "stack") {
      throw new Error("Invalid node type");
    }
    super.deserialize(data);
  }
}
