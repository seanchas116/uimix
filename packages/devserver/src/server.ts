import * as trpcExpress from "@trpc/server/adapters/express";
//import { initSocketIO } from "./socket";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { renderTrpcPanel } from "trpc-panel";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";
import path from "path";
import * as url from "url";
import { createAppRouter, createContext } from "./api/index.js";
import { createServer as createViteServer } from "vite";
import { componentsVirtualModulePlugin } from "./docgen.js";

interface ServerOptions {
  port: number;
  projectPath: string;
}

export async function startServer(options: ServerOptions) {
  const appRouter = createAppRouter(options);

  const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

  const app = express();
  app.use(
    cors({
      origin: process.env.FRONTEND_URL?.split(","),
    })
  );
  app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  app.use("/panel", (_, res) => {
    return res.send(renderTrpcPanel(appRouter, { url: "/trpc" }));
  });

  if (process.env.NODE_ENV !== "development") {
    app.use(express.static(path.resolve(__dirname, "static")));
  }

  const vite = await createViteServer({
    root: options.projectPath,
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
    base: "/project/",
    configFile: path.resolve(options.projectPath, "vite.config.uimix.ts"),
    plugins: [componentsVirtualModulePlugin(options.projectPath)],
  });
  app.use(vite.middlewares);

  const server = createServer(app);
  //initSocketIO(server);

  const wss = new WebSocketServer({
    server,
  });

  applyWSSHandler({
    wss,
    router: appRouter,
  });

  const port = options.port;
  server.listen(port, () => console.log(`listening on port ${port}`));
}
