import { describe, expect, it } from "vitest";
import { Document } from "./Document";
import * as Y from "yjs";
import { moveSelectables, Selectable } from "./Selectable";
import { Color } from "../utils/Color";
import { Project } from "./Project";
import { generateExampleNodes } from "./generateExampleNodes";
import * as fs from "fs";
import * as path from "path";
import { DocumentJSON } from "uimix-node-data";

function createEmptyDocument() {
  const ydoc = new Y.Doc();
  const project = new Project(ydoc.getMap("project"));
  const doc = project.getOrCreateDocument("Page 1");
  return [project, doc] as const;
}

describe(Document.name, () => {
  it("can insert nodes", () => {
    const [proj, doc] = createEmptyDocument();

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

    const selectable0 = proj.getSelectable([doc.root.children[0].id]);
    const selectable1 = proj.getSelectable([doc.root.children[1].id]);
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
    const [proj, doc] = createEmptyDocument();

    const frames: Selectable[] = [];

    for (let i = 0; i < 10; ++i) {
      const [frame] = doc.rootSelectable.append([
        { type: "frame", name: `Frame ${i}` },
      ]);
      const frameSelectable = proj.getSelectable([frame.id]);
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
    const [proj, doc] = createEmptyDocument();

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

    const rootSelectable = proj.getSelectable([rootNode.id]);
    expect(rootSelectable.originalNode.type).toBe("frame");
    rootSelectable.style.gap = 12;

    const textSelectable = rootSelectable.children[0];
    expect(textSelectable.originalNode === textNode).toBe(true);
    expect(textSelectable.originalNode.type).toBe("text");
    textSelectable.style.fontSize = 24;

    const hoverSelectable = proj.getSelectable([hoverVariant.id]);
    expect(hoverSelectable.originalNode === hoverVariant).toBe(true);
    expect(hoverSelectable.node === rootNode).toBe(true);
    expect(hoverSelectable.style.gap).toBe(12);

    const [instanceNode] = doc.root.insert(1, [
      {
        type: "instance",
        name: "Instance",
      },
    ]);

    const instanceSelectable = proj.getSelectable([instanceNode.id]);
    instanceSelectable.style.mainComponentID = componentID;

    const instanceTextSelectable = instanceSelectable.children[0];

    expect(instanceSelectable.mainComponent?.rootNode === rootNode).toBe(true);
    expect(instanceSelectable.style.gap).toBe(12);
    expect(instanceSelectable.parent === doc.rootSelectable).toBe(true);

    expect(instanceTextSelectable.originalNode === textNode).toBe(true);
    expect(instanceTextSelectable.style.fontSize).toBe(24);
    expect(instanceTextSelectable.parent === instanceSelectable).toBe(true);

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

  it("avoid infinite instantiation", () => {
    const [proj, doc] = createEmptyDocument();

    const [componentSelectable] = doc.rootSelectable.insert(0, [
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

    const [instance] = componentSelectable.children[0].append([
      {
        type: "instance",
      },
    ]);
    instance.style.mainComponentID = componentSelectable.originalNode.id;

    expect(instance.children.length).toBe(0);
  });

  it("example node snapshot", () => {
    const documentJSON = DocumentJSON.parse(
      JSON.parse(
        fs.readFileSync(
          path.join(__dirname, "__fixtures__/document.json"),
          "utf-8"
        )
      )
    );
    const [proj, doc] = createEmptyDocument();
    doc.loadJSON(documentJSON);

    expect(doc.toJSON()).toEqual(documentJSON);
  });

  it("can be renamed", () => {
    const [proj, doc] = createEmptyDocument();

    generateExampleNodes(doc);
    const oldData = doc.toJSON();
    proj.renameDocumentOrFolder(doc.filePath, "New Name");
    const newData = proj.getOrCreateDocument("New Name").toJSON();

    expect(oldData).toEqual(newData);
  });
});
