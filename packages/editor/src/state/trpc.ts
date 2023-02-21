import { createTRPCProxyClient, createWSClient, wsLink } from "@trpc/client";
import type { AppRouter } from "../../../devserver/src/api/router";

const wsProtocol = location.protocol === "https:" ? "wss" : "ws";

const wsClient = createWSClient({
  url: `${wsProtocol}://${location.host}/trpc`,
});

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    wsLink({
      client: wsClient,
    }),
  ],
});
