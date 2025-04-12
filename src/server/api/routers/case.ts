import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const caseRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.case.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { id } = input;
      
      return ctx.db.case.findUnique({
        where: { id },
        include: {
          sections: {
            orderBy: {
              order: "asc",
            },
          },
          documents: {
            orderBy: {
              uploadedAt: "desc",
            },
          },
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { title, description } = input;
      
      const newCase = await ctx.db.case.create({
        data: {
          title,
          description,
          userId: ctx.session.user.id,
          sections: {
            create: [
              { name: "Case Assessment", type: "CASE_ASSESSMENT", order: 0 },
              { name: "Counter Arguments", type: "COUNTER_ARGUMENTS", order: 1 },
              { name: "Discovery Plan", type: "DISCOVERY_PLAN", order: 2 },
            ],
          },
        },
        include: {
          sections: true,
        },
      });
      
      return newCase;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(100),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, title, description } = input;
      
      // Verify ownership
      const existingCase = await ctx.db.case.findUnique({
        where: { id },
        select: { userId: true },
      });
      
      if (!existingCase || existingCase.userId !== ctx.session.user.id) {
        throw new Error("Not authorized");
      }
      
      return ctx.db.case.update({
        where: { id },
        data: {
          title,
          description,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      
      // Verify ownership
      const existingCase = await ctx.db.case.findUnique({
        where: { id },
        select: { userId: true },
      });
      
      if (!existingCase || existingCase.userId !== ctx.session.user.id) {
        throw new Error("Not authorized");
      }
      
      return ctx.db.case.delete({
        where: { id },
      });
    }),
});