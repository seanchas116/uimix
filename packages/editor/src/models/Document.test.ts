import { describe, expect, it } from "vitest";
import { Document } from "./Document";
import * as Y from "yjs";
import { moveSelectables, Selectable } from "./Selectable";
import { Color } from "../utils/Color";

describe(Document.name, () => {
  it("can insert nodes", () => {
    const ydoc = new Y.Doc();
    const doc = new Document(ydoc.getMap("document"));

    doc.root.insert(0, [{ type: "frame", name: "Frame" }]);

    expect(doc.root.children[0].type).toBe("frame");

    doc.root.insert(0, [{ type: "text", name: "Text" }]);

    expect(doc.root.children[0].type).toBe("text");
    expect(doc.root.children[1].type).toBe("frame");
    expect(doc.root.children[0].name).toBe("Text");
    expect(doc.root.children[1].name).toBe("Frame");
    expect(doc.root.children[0].index).toBe(0);
    expect(doc.root.children[1].index).toBe(1);
    expect(doc.root.children.length).toBe(2);

    const selectable0 = doc.getSelectable([doc.root.children[0].id]);
    const selectable1 = doc.getSelectable([doc.root.children[1].id]);
    selectable0.style.gap = 10;
    expect(selectable0.originalNode === doc.root.children[0]).toBe(true);
    expect(selectable0.style.gap).toBe(10);
    expect(selectable1.originalNode === doc.root.children[1]).toBe(true);
    expect(selectable1.style.gap).toBe(0);

    doc.root.delete(0, 1);

    expect(doc.root.children[0].type).toBe("frame");
    expect(doc.root.children[0].index).toBe(0);
    expect(doc.root.children.length).toBe(1);
  });

  it("can move nodes", () => {
    const ydoc = new Y.Doc();
    const doc = new Document(ydoc.getMap("document"));

    const frames: Selectable[] = [];

    for (let i = 0; i < 10; ++i) {
      const [frame] = doc.rootSelectable.append([
        { type: "frame", name: `Frame ${i}` },
      ]);
      const frameSelectable = doc.getSelectable([frame.id]);
      const style = frameSelectable.style;
      style.position = {
        x: { type: "start", start: i * 100 + 50 },
        y: { type: "start", start: 90 },
      };
      style.width = { type: "fixed", value: 50 };
      style.height = { type: "fixed", value: 50 };
      style.fill = Color.from("red").toHex();

      frames.push(frame);
    }

    moveSelectables(doc.rootSelectable, frames[0], frames.slice(5));

    expect(doc.rootSelectable.children.map((c) => c.originalNode.name)).toEqual(
      [
        "Frame 5",
        "Frame 6",
        "Frame 7",
        "Frame 8",
        "Frame 9",
        "Frame 0",
        "Frame 1",
        "Frame 2",
        "Frame 3",
        "Frame 4",
      ]
    );

    moveSelectables(doc.rootSelectable, frames[7], [frames[5]]);
    expect(doc.rootSelectable.children.map((c) => c.originalNode.name)).toEqual(
      [
        "Frame 6",
        "Frame 5",
        "Frame 7",
        "Frame 8",
        "Frame 9",
        "Frame 0",
        "Frame 1",
        "Frame 2",
        "Frame 3",
        "Frame 4",
      ]
    );
  });

  it("handles components", () => {
    const ydoc = new Y.Doc();
    const doc = new Document(ydoc.getMap("document"));

    doc.root.insert(0, [
      {
        type: "component",
        name: "Test Component",
        children: [
          {
            type: "frame",
            name: "default",
            children: [
              {
                type: "text",
                name: "Text",
              },
            ],
          },
          {
            type: "variant",
            name: "hover",
          },
        ],
      },
    ]);

    expect(doc.root.children[0].type).toBe("component");
    const componentID = doc.root.children[0].id;

    const [rootNode, hoverVariant] = doc.root.children[0].children;
    const textNode = rootNode.children[0];

    const rootSelectable = doc.getSelectable([rootNode.id]);
    expect(rootSelectable.originalNode.type).toBe("frame");
    rootSelectable.style.gap = 12;

    const textSelectable = rootSelectable.children[0];
    expect(textSelectable.originalNode === textNode).toBe(true);
    expect(textSelectable.originalNode.type).toBe("text");
    textSelectable.style.fontSize = 24;

    const hoverSelectable = doc.getSelectable([hoverVariant.id]);
    expect(hoverSelectable.originalNode === hoverVariant).toBe(true);
    expect(hoverSelectable.node === rootNode).toBe(true);
    expect(hoverSelectable.style.gap).toBe(12);

    const [instanceNode] = doc.root.insert(1, [
      {
        type: "instance",
        name: "Instance",
      },
    ]);

    const instanceSelectable = doc.getSelectable([instanceNode.id]);
    instanceSelectable.style.mainComponentID = componentID;

    const instanceTextSelectable = instanceSelectable.children[0];

    expect(instanceSelectable.mainComponent?.rootNode === rootNode).toBe(true);
    expect(instanceSelectable.style.gap).toBe(12);

    expect(instanceTextSelectable.originalNode === textNode).toBe(true);
    expect(instanceTextSelectable.style.fontSize).toBe(24);

    instanceSelectable.style.gap = 16;
    expect(instanceSelectable.style.gap).toBe(16);
    expect(rootSelectable.style.gap).toBe(12);

    instanceTextSelectable.style.fontSize = 32;
    expect(instanceTextSelectable.style.fontSize).toBe(32);
    expect(textSelectable.style.fontSize).toBe(24);

    rootSelectable.select();
    expect(rootSelectable.selected).toBe(true);
    expect(instanceSelectable.selected).toBe(false);
    expect(textSelectable.selected).toBe(false);
    expect(textSelectable.ancestorSelected).toBe(true);
  });
});
