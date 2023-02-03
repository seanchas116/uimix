import { Project } from "../models/Project";
import { trpc } from "./trpc";
import { io, Socket } from "socket.io-client";
import { Node } from "../models/Node";
import { NodeChanges, NodeData, NodeChangesForDocument } from "node-data";
import { assertNonNull } from "../utils/Assert";
import { DocumentNode } from "../models/DocumentNode";
import { action } from "mobx";
import { getIDToken } from "./firebase";
import { throttle } from "lodash-es";

export class BackendAdapter {
  constructor(project: Project, projectID?: string) {
    this.project = project;
    this.projectID = projectID;

    trpc.hello.query("hoge").then((res) => {
      console.log(res);
    });
  }

  async init() {
    let documentId: string;
    if (!this.projectID) {
      const res = await trpc.projectCreate.mutate({ name: "Untitled" });

      this.projectID = res.id;

      const searchParams = new URLSearchParams(location.search);
      searchParams.set("project", this.projectID);
      history.replaceState(null, "", `?${searchParams.toString()}`);

      documentId = res.documents[0].id;
    } else {
      const res = await trpc.projectGet.query({ id: this.projectID });
      documentId = assertNonNull(res).documents[0].id;
    }

    this.project.document = new DocumentNode(documentId);

    this.project.document.onNodeDidAdd(this.onNodeDidChange.bind(this));
    this.project.document.onNodeDidChange(this.onNodeDidChange.bind(this));
    this.project.document.onNodeDidRemove(this.onNodeDidRemove.bind(this));

    const socket = io(import.meta.env.VITE_BACKEND_URL, {
      transports: ["websocket"],
      auth: {
        token: await getIDToken(),
      },
      query: {
        projectID: this.projectID,
      },
    });
    socket.on("nodes", (nodes) => {
      this.onRemoteUpdate(nodes);
    });
    this.socket = socket;
  }

  readonly project: Project;
  projectID: string | undefined;
  private socket: Socket | undefined;

  private onRemoteUpdate(changes: NodeChangesForDocument) {
    this.project.remoteUpdate(
      action(() => {
        //console.log("remote update", changes);

        for (const [documentID, nodes] of Object.entries(changes)) {
          if (documentID !== this.project.document.id) {
            continue;
          }

          const updates: Record<string, NodeData> = {};
          const removes: string[] = [];

          for (const [nodeID, nodeData] of Object.entries(nodes)) {
            if (nodeData) {
              updates[nodeID] = nodeData;
            } else {
              removes.push(nodeID);
            }
          }

          this.project.updateNodes(updates);
          this.project.deleteNodes(removes);
        }
      })
    );
  }

  private localPreviewChanges: NodeChanges = {};
  private localPersistChanges: NodeChanges = {};

  private sendLocalChanges(persist: boolean) {
    if (!this.socket) {
      return;
    }
    const changes = persist
      ? this.localPersistChanges
      : this.localPreviewChanges;

    if (Object.keys(changes).length === 0) {
      return;
    }

    //console.log("local update", changes);
    this.socket.emit("nodes", {
      nodes: {
        [this.project.document.id]: {
          ...changes,
        },
      },
      persist,
    });

    this.localPreviewChanges = {};
    if (persist) {
      this.localPersistChanges = {};
    }
  }

  private sendLocalPreviewChangesLater = throttle(() => {
    this.sendLocalChanges(false);
  }, 1000 / 30);

  persistLocalChanges() {
    queueMicrotask(() => this.sendLocalChanges(true));
  }

  private onNodeDidChange(node: Node) {
    if (!this.socket || this.project.duringRemoteUpdate) {
      return;
    }

    const nodeData = node.serialize();
    this.localPreviewChanges[node.id] = nodeData;
    this.localPersistChanges[node.id] = nodeData;
    this.sendLocalPreviewChangesLater();
  }

  private onNodeDidRemove(node: Node) {
    if (!this.socket || this.project.duringRemoteUpdate) {
      return;
    }

    this.localPreviewChanges[node.id] = null;
    this.localPersistChanges[node.id] = null;
    this.sendLocalPreviewChangesLater();
  }
}
