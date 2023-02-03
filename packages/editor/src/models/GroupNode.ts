import { GroupNodeData } from "node-data";
import { NodeBase } from "./NodeBase";

export class GroupNode extends NodeBase {
  constructor(id?: string) {
    super(id);
    this.watchPropChanges();
  }

  get type(): "group" {
    return "group";
  }

  get canHaveChildren(): boolean {
    return true;
  }

  serialize(): GroupNodeData {
    return {
      ...this.serializeCommon(),
      type: "group",
    };
  }
}
