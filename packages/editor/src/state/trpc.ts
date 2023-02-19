import { createTRPCProxyClient, createWSClient, wsLink } from "@trpc/client";
import type { AppRouter } from "../../../devserver/src/api/router";

const wsClient = createWSClient({
  url: `ws://${location.host}/trpc`,
});

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    wsLink({
      client: wsClient,
    }),
  ],
});
