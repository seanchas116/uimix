import { makeObservable, observable } from "mobx";
import { NodeData, ShapeNodeData } from "node-data";
import { Rect } from "paintvec";
import { Path } from "./Path";
import { rectFromJSON, rectToJSON } from "../types/Rect";
import { NodeBase } from "./NodeBase";
import { serializeTextStyle } from "./Style";

export class ShapeNode extends NodeBase {
  constructor(id?: string) {
    super(id);
    makeObservable(this);
    this.watchPropChanges();
  }

  get type(): "shape" {
    return "shape";
  }

  get canHaveChildren(): boolean {
    return false;
  }

  @observable path = new Path();
  @observable viewBox = new Rect();

  serialize(): ShapeNodeData {
    return {
      ...this.serializeCommonWithStyle((s) => serializeTextStyle(s)),
      type: "shape",
      path: this.path.toJSON(),
      viewBox: rectToJSON(this.viewBox),
    };
  }

  deserialize(data: NodeData): void {
    if (data.type !== "shape") {
      throw new Error("Invalid node type");
    }
    super.deserialize(data);
    this.path = Path.fromJSON(data.path);
    this.viewBox = rectFromJSON(data.viewBox);
  }
}
