import { makeObservable, observable } from "mobx";
import { PathData, PathLoopData, PathVertexData } from "node-data";
import { Rect, Transform, Vec2 } from "paintvec";
import { encodeSVGPath, SVGPathData } from "svg-pathdata";
import paper from "paper";

// TODO: do this globally
paper.setup([640, 480]);

type SVGCommand = SVGPathData["commands"][number];

export class PathVertex {
  constructor(
    point = new Vec2(),
    inHandle = new Vec2(),
    outHandle = new Vec2()
  ) {
    this.point = point;
    this.inHandle = inHandle;
    this.outHandle = outHandle;
    makeObservable(this);
  }

  @observable point: Vec2;
  @observable inHandle: Vec2; // relative to position
  @observable outHandle: Vec2; // relative to position

  transform(transform: Transform): PathVertex {
    return new PathVertex(
      this.point.transform(transform),
      this.inHandle.transform(transform.withoutTranslation),
      this.outHandle.transform(transform.withoutTranslation)
    );
  }

  toJSON(): PathVertexData {
    return {
      x: this.point.x,
      y: this.point.y,
      inX: this.inHandle.x,
      inY: this.inHandle.y,
      outX: this.outHandle.x,
      outY: this.outHandle.y,
    };
  }

  static fromJSON(data: PathVertexData): PathVertex {
    return new PathVertex(
      new Vec2(data.x, data.y),
      new Vec2(data.inX, data.inY),
      new Vec2(data.outX, data.outY)
    );
  }
}

export class PathLoop {
  readonly nodes = observable<PathVertex>([]);
  @observable closed = false;

  constructor(nodes: readonly PathVertex[] = [], closed = false) {
    this.nodes.replace(nodes as PathVertex[]);
    this.closed = closed;
    makeObservable(this);
  }

  transform(transform: Transform): PathLoop {
    const loop = new PathLoop();
    loop.nodes.replace(this.nodes.map((node) => node.transform(transform)));
    loop.closed = this.closed;
    return loop;
  }

  toJSON(): PathLoopData {
    return {
      vertices: this.nodes.map((node) => node.toJSON()),
      closed: this.closed,
    };
  }

  static fromJSON(data: PathLoopData): PathLoop {
    return new PathLoop(
      data.vertices.map((v) => PathVertex.fromJSON(v)),
      data.closed
    );
  }
}

export class Path {
  constructor(loops: readonly PathLoop[] = []) {
    this.loops.replace(loops as PathLoop[]);
  }

  readonly loops = observable<PathLoop>([]);

  transform(transform: Transform): Path {
    return new Path(this.loops.map((loop) => loop.transform(transform)));
  }

  boundingBox(): Rect {
    const paperPath = new paper.Path(this.toSVGPathData());
    return Rect.from(paperPath.bounds);
  }

  toSVGPathData(): string {
    const items: SVGCommand[] = [];

    for (const loop of this.loops) {
      if (!loop.nodes.length) {
        continue;
      }
      items.push({
        type: SVGPathData.MOVE_TO,
        relative: false,
        x: loop.nodes[0].point.x,
        y: loop.nodes[0].point.y,
      });

      const count = loop.closed ? loop.nodes.length : loop.nodes.length - 1;
      for (let i = 0; i < count; ++i) {
        const node = loop.nodes[(i + 1) % loop.nodes.length];
        const prevNode = loop.nodes[i];

        if (
          node.inHandle.x === 0 &&
          node.inHandle.y === 0 &&
          prevNode.outHandle.x === 0 &&
          prevNode.outHandle.y === 0
        ) {
          if (prevNode.point.x === node.point.x) {
            items.push({
              type: SVGPathData.VERT_LINE_TO,
              relative: false,
              y: node.point.y,
            });
          } else if (prevNode.point.y === node.point.y) {
            items.push({
              type: SVGPathData.HORIZ_LINE_TO,
              relative: false,
              x: node.point.x,
            });
          } else {
            items.push({
              type: SVGPathData.LINE_TO,
              relative: false,
              x: node.point.x,
              y: node.point.y,
            });
          }
        } else {
          items.push({
            type: SVGPathData.CURVE_TO,
            relative: false,
            x: node.point.x,
            y: node.point.y,
            x1: prevNode.point.x + prevNode.outHandle.x,
            y1: prevNode.point.y + prevNode.outHandle.y,
            x2: node.point.x + node.inHandle.x,
            y2: node.point.y + node.inHandle.y,
          });
        }
      }

      if (loop.closed) {
        items.push({
          type: SVGPathData.CLOSE_PATH,
        });
      }
    }

    return encodeSVGPath(items);
  }

  static fromSVGPathData(d: string): Path {
    const pathData = new SVGPathData(d);
    const normalized = pathData.toAbs().normalizeHVZ().normalizeST().qtToC();
    const { commands } = normalized;

    const loops: PathLoop[] = [];

    for (const command of commands) {
      if (command.type === SVGPathData.MOVE_TO) {
        const loop = new PathLoop();
        loops.push(loop);
        const node = new PathVertex();
        node.point = new Vec2(command.x, command.y);
        loop.nodes.push(node);
      } else if (
        command.type === SVGPathData.LINE_TO ||
        command.type === SVGPathData.CURVE_TO
      ) {
        const loop = loops[loops.length - 1];
        const prevNode = loop.nodes[loop.nodes.length - 1];

        // Skip empty line
        if (
          command.type === SVGPathData.LINE_TO &&
          prevNode.point.x === command.x &&
          prevNode.point.y === command.y
        ) {
          continue;
        }

        const node = new PathVertex();
        loop.nodes.push(node);

        if (command.type === SVGPathData.LINE_TO) {
          node.point = new Vec2(command.x, command.y);
        } else {
          node.point = new Vec2(command.x, command.y);
          node.inHandle = new Vec2(command.x2, command.y2).sub(node.point);
          prevNode.outHandle = new Vec2(command.x1, command.y1).sub(
            prevNode.point
          );
        }
      } else {
        throw new Error(`unsupported command type: ${command.type}`);
      }
    }

    for (const loop of loops) {
      if (loop.nodes[0].point.equals(loop.nodes[loop.nodes.length - 1].point)) {
        loop.nodes[0].inHandle = loop.nodes[loop.nodes.length - 1].inHandle;
        loop.nodes.pop();
        loop.closed = true;
      }
    }

    return new Path(loops);
  }

  static rect(rect: Rect): Path {
    const loop = new PathLoop();
    loop.nodes.push(...rect.vertices.map((v) => new PathVertex(v)));
    loop.closed = true;
    return new Path([loop]);
  }

  static unitCircle(): Path {
    const K = 0.5522847498;
    const loop = new PathLoop();

    loop.nodes.push(
      new PathVertex(new Vec2(-1, 0), new Vec2(0, K), new Vec2(0, -K)),
      new PathVertex(new Vec2(0, -1), new Vec2(-K, 0), new Vec2(K, 0)),
      new PathVertex(new Vec2(1, 0), new Vec2(0, -K), new Vec2(0, K)),
      new PathVertex(new Vec2(0, 1), new Vec2(K, 0), new Vec2(-K, 0))
    );
    loop.closed = true;
    return new Path([loop]);
  }

  toJSON(): PathData {
    return {
      loops: this.loops.map((loop) => loop.toJSON()),
    };
  }

  static fromJSON(data: PathData): Path {
    return new Path(data.loops.map((loop) => PathLoop.fromJSON(loop)));
  }
}
