import { describe, expect, it } from "vitest";
import { DocumentNode } from "./DocumentNode";
import { FrameNode } from "./FrameNode";
import { History } from "./History";

describe(History.name, () => {
  it("", () => {
    const document = new DocumentNode();

    const frames: FrameNode[] = [];
    for (let i = 0; i < 10; ++i) {
      const frame = new FrameNode();
      frame.name = `Frame ${i}`;
      frames.push(frame);
    }
    document.append(frames);

    const history = new History(document);

    const framesToMove = frames.slice(0, 5);
    document.append(framesToMove);

    history.commit();

    expect(history.canUndo).toEqual(true);
    expect(history.canRedo).toEqual(false);

    expect(document.children.map((child) => child.name)).toMatchInlineSnapshot(`
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
    `);

    history.undo();

    expect(history.canUndo).toEqual(false);
    expect(history.canRedo).toEqual(true);

    expect(document.children.map((child) => child.name)).toMatchInlineSnapshot(`
      [
        "Frame 0",
        "Frame 1",
        "Frame 2",
        "Frame 3",
        "Frame 4",
        "Frame 5",
        "Frame 6",
        "Frame 7",
        "Frame 8",
        "Frame 9",
      ]
    `);

    history.redo();

    expect(document.children.map((child) => child.name)).toMatchInlineSnapshot(`
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
    `);

    for (let i = 0; i < 5; ++i) {
      document.firstChild?.remove();
    }

    history.commit();
    expect(document.children.map((child) => child.name)).toMatchInlineSnapshot(`
      [
        "Frame 0",
        "Frame 1",
        "Frame 2",
        "Frame 3",
        "Frame 4",
      ]
    `);

    history.undo();
    expect(document.children.map((child) => child.name)).toMatchInlineSnapshot(`
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
    `);
  });
});
