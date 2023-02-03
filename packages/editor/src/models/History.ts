import { computed, makeObservable } from "mobx";
import { NodeData } from "node-data";
import { assertNonNull } from "../utils/Assert";
import { EventEmitter } from "../utils/EventEmitter";
import { generateID } from "../utils/ID";
import { UndoStack } from "../utils/UndoStack";
import { DocumentNode } from "./DocumentNode";
import { Node } from "./Node";

interface Change {
  before?: NodeData;
  after?: NodeData;
}

export class History {
  constructor(
    document: DocumentNode,
    {
      shouldIgnoreChanges = () => false,
    }: {
      shouldIgnoreChanges?: () => boolean;
    } = {}
  ) {
    this.shouldIgnoreChanges = shouldIgnoreChanges;
    this.document = document;

    this.disposers = [
      document.onNodeDidAdd((node) => this.onNodeDidAdd(node)),
      document.onNodeWillRemove((node) => this.onNodeWillRemove(node)),
      document.onNodeWillChange((node) => this.onNodeWillChange(node)),
    ];

    this.clear();

    makeObservable(this);
  }

  dispose() {
    this.disposers.forEach((disposer) => disposer());
  }

  private _onDidChange = new EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  readonly shouldIgnoreChanges: () => boolean;
  readonly document: DocumentNode;
  readonly disposers: (() => void)[] = [];

  private undoStack = new UndoStack();

  private addedNodes = new Set<Node>();
  private changedNodes = new Map<Node, NodeData>();
  private removedNodes = new Map<Node, NodeData>();

  private isReplaying = false;

  clear() {
    this.undoStack.clear();
    this.addedNodes.clear();
    this.changedNodes.clear();
    this.removedNodes.clear();
    this._onDidChange.emit();
  }

  undo() {
    this.undoStack.undo();
  }

  redo() {
    this.undoStack.redo();
  }

  @computed get canUndo() {
    return this.undoStack.canUndo;
  }

  @computed get canRedo() {
    return this.undoStack.canRedo;
  }

  @computed get currentUndoID(): string | undefined {
    return this.undoStack.commandToUndo?.id;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  commit(text?: string) {
    const changes = new Map<string, Change>();
    for (const [changed, before] of this.changedNodes) {
      changes.set(changed.id, {
        before,
        after: changed.serialize(),
      });
    }
    for (const [removed, before] of this.removedNodes) {
      changes.set(removed.id, {
        before,
        after: undefined,
      });
    }
    for (const added of this.addedNodes) {
      changes.set(added.id, {
        before: undefined,
        after: added.serialize(),
      });
    }
    this.addedNodes.clear();
    this.changedNodes.clear();
    this.removedNodes.clear();

    const reverseChanges = new Map<
      string,
      { before?: NodeData; after?: NodeData }
    >();
    for (const [id, { before, after }] of changes) {
      reverseChanges.set(id, { before: after, after: before });
    }

    console.log(changes);

    this.undoStack.push({
      id: generateID(),
      undo: () => {
        console.log("undo");
        this.replay(reverseChanges);
      },
      redo: () => {
        console.log("redo");
        this.replay(changes);
      },
    });

    this._onDidChange.emit();
  }

  private replay(changes: Map<string, Change>) {
    try {
      this.isReplaying = true;
      for (const [id, { after }] of changes) {
        if (after) {
          const node: Node =
            this.document.nodes.get(id) ||
            this.document.createNode(after.type, id);
          node.deserializeAndReparent(after, (id) =>
            this.document.nodes.get(id)
          );
        } else {
          const node = assertNonNull(this.document.nodes.get(id));
          node.remove();
        }
      }
      this._onDidChange.emit();
    } finally {
      this.isReplaying = false;
    }
  }

  private onNodeDidAdd(node: Node) {
    if (this.isReplaying || this.shouldIgnoreChanges()) {
      return;
    }

    const removedNodeSnapshot = this.removedNodes.get(node);
    if (removedNodeSnapshot) {
      this.changedNodes.set(node, removedNodeSnapshot);
      this.removedNodes.delete(node);
    } else {
      this.addedNodes.add(node);
    }

    for (const child of node.children) {
      this.onNodeDidAdd(child);
    }
  }

  private onNodeWillRemove(node: Node) {
    if (this.isReplaying || this.shouldIgnoreChanges()) {
      return;
    }

    if (this.addedNodes.has(node)) {
      this.addedNodes.delete(node);
    } else {
      this.removedNodes.set(node, node.serialize());
    }

    for (const child of node.children) {
      this.onNodeWillRemove(child);
    }
  }

  private onNodeWillChange(node: Node) {
    if (this.isReplaying || this.shouldIgnoreChanges()) {
      return;
    }

    if (!this.changedNodes.has(node)) {
      this.changedNodes.set(node, node.serialize());
    }
  }
}
