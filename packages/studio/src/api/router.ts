import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const appRouter = t.router({
  hello: t.procedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .query((req) => {
      const { input } = req;
      return `Hello ${input.name}`;
    }),
});

export type AppRouter = typeof appRouter;
