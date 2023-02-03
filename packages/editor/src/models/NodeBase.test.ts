import { describe, it, expect } from "vitest";
import { FrameNode } from "./FrameNode";
import { NodeBase } from "./NodeBase";

describe(NodeBase.name, () => {
  describe("basic traversing", () => {
    it("is correct", () => {
      const parent = new FrameNode();
      const child0 = new FrameNode();
      const child1 = new FrameNode();
      const child2 = new FrameNode();
      parent.append([child0, child1, child2]);
      const child3 = new FrameNode();
      const child4 = new FrameNode();
      parent.insertBefore([child3], child0);
      parent.insertBefore([child4], child2);

      expect(parent.firstChild).toEqual(child3);
      expect(parent.lastChild).toEqual(child2);

      expect(child3.parent).toEqual(parent);
      expect(child3.previousSibling).toEqual(undefined);
      expect(child3.nextSibling).toEqual(child0);

      expect(child0.parent).toEqual(parent);
      expect(child0.previousSibling).toEqual(child3);
      expect(child0.nextSibling).toEqual(child1);

      expect(child1.parent).toEqual(parent);
      expect(child1.previousSibling).toEqual(child0);
      expect(child1.nextSibling).toEqual(child4);

      expect(child4.parent).toEqual(parent);
      expect(child4.previousSibling).toEqual(child1);
      expect(child4.nextSibling).toEqual(child2);

      expect(child2.parent).toEqual(parent);
      expect(child2.previousSibling).toEqual(child4);
      expect(child2.nextSibling).toEqual(undefined);

      expect(parent.children).toEqual([child3, child0, child1, child4, child2]);

      child2.remove();
      child3.remove();
      child1.remove();

      for (const child of [child1, child2, child3]) {
        expect(child.parent).toEqual(undefined);
        expect(child.previousSibling).toEqual(undefined);
        expect(child.nextSibling).toEqual(undefined);
      }

      expect(child0.parent).toEqual(parent);
      expect(child0.previousSibling).toEqual(undefined);
      expect(child0.nextSibling).toEqual(child4);

      expect(child4.parent).toEqual(parent);
      expect(child4.previousSibling).toEqual(child0);
      expect(child4.nextSibling).toEqual(undefined);

      expect(parent.children).toEqual([child0, child4]);
      expect(parent.firstChild).toEqual(child0);
      expect(parent.lastChild).toEqual(child4);

      child0.remove();
      child4.remove();

      expect(parent.children).toEqual([]);
      expect(parent.firstChild).toEqual(undefined);
      expect(parent.lastChild).toEqual(undefined);
    });
  });
  describe("children", () => {
    it("removes child automatically when child is inserted to another parent", () => {
      const parent1 = new FrameNode();
      const parent2 = new FrameNode();
      const child = new FrameNode();
      parent1.append([child]);
      expect(parent1.children).toEqual([child]);
      parent2.append([child]);
      expect(parent1.children).toEqual([]);
      expect(parent2.children).toEqual([child]);
    });
  });
});
