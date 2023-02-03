/* eslint-disable import/namespace */
import { Project } from "../models/Project";
import * as db from "firebase/database";
import { generateID } from "../utils/ID";
import { DocumentNode } from "../models/DocumentNode";
import { generateExampleProject } from "./generateExampleNodes";
import { NodeData } from "node-data";
import { action } from "mobx";
import { Node } from "../models/Node";
import { app } from "./firebase";
import { trpc } from "./trpc";
import { throttle } from "lodash-es";

interface DocumentData {
  name: string;
}

export class FirebaseAdapter {
  constructor(project: Project, projectID: string | undefined) {
    this.project = project;
    this.projectID = projectID;
    this.database = db.getDatabase(app);
  }

  async init() {
    // Create Project

    if (!this.projectID) {
      const res = await trpc.projectCreate.mutate({ name: "Untitled" });

      this.projectID = res.id;

      const searchParams = new URLSearchParams(location.search);
      searchParams.set("project", this.projectID);
      history.replaceState(null, "", `?${searchParams.toString()}`);
    } else {
      const res = await trpc.projectGet.query({ id: this.projectID });
    }

    // Create Document

    const documents: Record<string, DocumentData> | null = (
      await db.get(db.ref(this.database, `v1/documents/${this.projectID}`))
    ).val();

    let documentID: string;
    let generatesExample = false;

    if (!documents || Object.keys(documents).length === 0) {
      documentID = generateID();
      generatesExample = true;
      await db.set(
        db.ref(this.database, `v1/documents/${this.projectID}/${documentID}`),
        {
          name: "Page 0",
        }
      );
    } else {
      documentID = Object.keys(documents)[0];
    }

    this.project.document = new DocumentNode(documentID);

    const nodesRef = this.nodesRef;

    // Generate Example Nodes

    if (generatesExample) {
      generateExampleProject(this.project);

      const data: Record<string, NodeData & { clientID: string }> = {};
      for (const node of Object.values(this.project.toJSON().nodes)) {
        data[node.id] = { ...node, clientID: this.clientID };
      }

      await db.set(nodesRef, JSON.parse(JSON.stringify(data)));
    }

    db.onChildAdded(nodesRef, this.onFirebaseNodeChange.bind(this));
    db.onChildChanged(nodesRef, this.onFirebaseNodeChange.bind(this));
    db.onChildRemoved(nodesRef, this.onFirebaseNodeRemove.bind(this));

    this.project.document.onNodeDidAdd(this.onNodeDidChange.bind(this));
    this.project.document.onNodeDidChange(this.onNodeDidChange.bind(this));
    this.project.document.onNodeDidRemove(this.onNodeDidRemove.bind(this));
  }

  readonly project: Project;
  projectID: string | undefined;
  readonly database: db.Database;
  readonly clientID = generateID();

  private get nodesRef() {
    return db.ref(
      this.database,
      `v1/nodes/${this.projectID}/${this.project.document.id}`
    );
  }

  private nodeRef(nodeID: string) {
    return db.ref(
      this.database,
      `v1/nodes/${this.projectID}/${this.project.document.id}/${nodeID}`
    );
  }

  private firebaseChanges: Record<string, NodeData | null> = {};

  private applyFirebaseChanges() {
    this.project.remoteUpdate(() => {
      const updates: Record<string, NodeData> = {};
      const removes: string[] = [];

      for (const [nodeID, nodeData] of Object.entries(this.firebaseChanges)) {
        if (nodeData) {
          updates[nodeID] = nodeData;
        } else {
          removes.push(nodeID);
        }
      }

      this.project.updateNodes(updates);
      this.project.deleteNodes(removes);
      this.firebaseChanges = {};
    });
  }

  private applyFirebaseChangesLater() {
    queueMicrotask(
      action(() => {
        this.applyFirebaseChanges();
      })
    );
  }

  private onFirebaseNodeChange(snapshot: db.DataSnapshot) {
    if (!snapshot.key) {
      return;
    }
    if (snapshot.val()?.clientID === this.clientID) {
      return;
    }
    console.log("update", snapshot.key, snapshot.val());

    this.firebaseChanges[snapshot.key] = snapshot.val();
    this.applyFirebaseChangesLater();
  }

  private onFirebaseNodeRemove(snapshot: db.DataSnapshot) {
    if (!snapshot.key) {
      return;
    }
    console.log("delete", snapshot.key);

    this.firebaseChanges[snapshot.key] = null;
    this.applyFirebaseChangesLater();
  }

  private localChanges: Record<string, NodeData | null> = {};

  private sendLocalChanges() {
    if (Object.keys(this.localChanges).length === 0) {
      return;
    }

    for (const [id, data] of Object.entries(this.localChanges)) {
      if (id) {
        db.set(this.nodeRef(id), data);
      } else {
        db.remove(this.nodeRef(id));
      }
    }

    this.localChanges = {};
  }

  private sendLocalChangesLater = throttle(() => {
    this.sendLocalChanges();
  }, 1000 / 30);

  private onNodeDidChange(node: Node) {
    if (this.project.duringRemoteUpdate) {
      return;
    }

    this.localChanges[node.id] = node.serialize();
    this.sendLocalChangesLater();
  }

  private onNodeDidRemove(node: Node) {
    if (this.project.duringRemoteUpdate) {
      return;
    }

    this.localChanges[node.id] = null;
    this.sendLocalChangesLater();
  }
}
