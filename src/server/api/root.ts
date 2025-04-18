import { postRouter } from "~/server/api/routers/post";
import { caseRouter } from "~/server/api/routers/case";
import { documentRouter } from "~/server/api/routers/document";
import { sectionRouter } from "~/server/api/routers/section";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  case: caseRouter,
  document: documentRouter,
  section: sectionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);