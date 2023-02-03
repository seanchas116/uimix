import { Rect, Vec2 } from "paintvec";
import { FrameNode } from "../../../models/FrameNode";
import { ImageNode } from "../../../models/ImageNode";
import { Selectable } from "../../../models/Selectable";
import { TextNode } from "../../../models/TextNode";
import { projectState } from "../../../state/ProjectState";
import { InsertMode } from "../../../state/InsertMode";
import { scrollState } from "../../../state/ScrollState";
import { snapper } from "../../../state/Snapper";
import { viewportState } from "../../../state/ViewportState";
import { Color } from "../../../utils/Color";
import { dragStartThreshold } from "../constants";
import { NodePickResult } from "../renderer/NodePicker";
import { DragHandler } from "./DragHandler";

export class NodeInsertDragHandler implements DragHandler {
  constructor(mode: InsertMode, pickResult: NodePickResult) {
    this.mode = mode;

    this.initClientPos = new Vec2(
      pickResult.event.clientX,
      pickResult.event.clientY
    );
    this.initPos = snapper.snapInsertPoint(
      scrollState.documentPosForEvent(pickResult.event)
    );

    const parent = pickResult.default ?? projectState.rootSelectable;

    if (mode.type === "text") {
      const node = new TextNode();
      node.name = "Text";
      parent?.node.append([node]);
      this.instance = Selectable.get(node);
      this.instance.style.fill = Color.from("black");
      this.instance.style.width = { type: "hugContents" };
      this.instance.style.height = { type: "hugContents" };
    } else if (mode.type === "image") {
      const node = new ImageNode();
      node.name = "Image";
      node.source = mode.source;
      parent?.node.append([node]);
      this.instance = Selectable.get(node);
      this.instance.style.fill = Color.from("white");
      this.instance.style.width = { type: "fixed", value: 100 };
      this.instance.style.height = { type: "fixed", value: 100 };
    } else {
      const node = new FrameNode();
      node.name = "Frame";
      parent?.node.append([node]);
      this.instance = Selectable.get(node);
      this.instance.style.fill = Color.from("white");
      this.instance.style.width = { type: "fixed", value: 100 };
      this.instance.style.height = { type: "fixed", value: 100 };
    }

    this.instance.resizeWithBoundingBox(
      Rect.boundingRect([this.initPos, this.initPos]),
      {
        x: true,
        y: true,
      }
    );

    projectState.rootSelectable.deselect();
    this.instance.select();
  }

  move(event: MouseEvent | DragEvent): void {
    const clientPos = new Vec2(event.clientX, event.clientY);
    if (
      !this.dragStarted &&
      clientPos.sub(this.initClientPos).length < dragStartThreshold
    ) {
      return;
    }
    this.dragStarted = true;

    const pos = snapper.snapResizePoint(scrollState.documentPosForEvent(event));
    const rect = Rect.boundingRect([pos, this.initPos]);

    this.instance.resizeWithBoundingBox(rect, {
      x: true,
      y: true,
      width: true,
      height: true,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  end(event: MouseEvent | DragEvent): void {
    viewportState.insertMode = undefined;
    projectState.history.commit("Insert component");
  }

  private readonly mode: InsertMode;
  private readonly instance: Selectable;
  private readonly initPos: Vec2;
  private readonly initClientPos: Vec2;
  private dragStarted = false;
}
