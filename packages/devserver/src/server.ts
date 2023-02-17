import * as trpcExpress from "@trpc/server/adapters/express";
//import { initSocketIO } from "./socket";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { renderTrpcPanel } from "trpc-panel";
import { appRouter, createContext } from ".";

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

const server = createServer(app);
//initSocketIO(server);

const port = process.env.PORT || 4000;

server.listen(port, () => console.log(`listening on port ${port}`));
