import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const sectionRouter = createTRPCRouter({
  getAllByCaseId: protectedProcedure
    .input(z.object({ caseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { caseId } = input;
      
      // Verify case ownership
      const caseExists = await ctx.db.case.findUnique({
        where: { id: caseId },
        select: { userId: true },
      });
      
      if (!caseExists || caseExists.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized to access this case",
        });
      }
      
      return ctx.db.section.findMany({
        where: { caseId },
        orderBy: { order: "asc" },
        include: {
          documents: {
            orderBy: { uploadedAt: "desc" },
          },
        },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { id } = input;
      
      const section = await ctx.db.section.findUnique({
        where: { id },
        include: {
          case: {
            select: { userId: true },
          },
          documents: {
            orderBy: { uploadedAt: "desc" },
          },
        },
      });
      
      if (!section) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Section not found",
        });
      }
      
      if (section.case.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized to access this section",
        });
      }
      
      return section;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        type: z.enum(["CASE_ASSESSMENT", "COUNTER_ARGUMENTS", "DISCOVERY_PLAN", "OTHER"]),
        content: z.string().optional(),
        caseId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, type, content, caseId } = input;
      
      // Verify case ownership
      const caseExists = await ctx.db.case.findUnique({
        where: { id: caseId },
        select: { userId: true },
      });
      
      if (!caseExists || caseExists.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized to add sections to this case",
        });
      }
      
      // Find the highest order value to add the new section at the end
      const highestOrder = await ctx.db.section.findFirst({
        where: { caseId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      
      const order = (highestOrder?.order ?? -1) + 1;
      
      return ctx.db.section.create({
        data: {
          name,
          type,
          content,
          order,
          case: {
            connect: { id: caseId },
          },
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        content: z.string().optional(),
        order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, content, order } = input;
      
      // Verify section ownership
      const section = await ctx.db.section.findUnique({
        where: { id },
        include: {
          case: {
            select: { userId: true },
          },
        },
      });
      
      if (!section) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Section not found",
        });
      }
      
      if (section.case.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized to update this section",
        });
      }
      
      return ctx.db.section.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(content !== undefined && { content }),
          ...(order !== undefined && { order }),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      
      // Verify section ownership
      const section = await ctx.db.section.findUnique({
        where: { id },
        include: {
          case: {
            select: { userId: true },
          },
          documents: {
            select: { id: true },
          },
        },
      });
      
      if (!section) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Section not found",
        });
      }
      
      if (section.case.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized to delete this section",
        });
      }
      
      // Check if section has documents
      if (section.documents.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete section with documents",
        });
      }
      
      return ctx.db.section.delete({
        where: { id },
      });
    }),

  reorder: protectedProcedure
    .input(
      z.object({
        caseId: z.string(),
        orderedSectionIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { caseId, orderedSectionIds } = input;
      
      // Verify case ownership
      const caseExists = await ctx.db.case.findUnique({
        where: { id: caseId },
        select: { userId: true },
      });
      
      if (!caseExists || caseExists.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized to reorder sections in this case",
        });
      }
      
      // Update the order of each section
      const updates = orderedSectionIds.map((sectionId, index) => {
        return ctx.db.section.update({
          where: { id: sectionId },
          data: { order: index },
        });
      });
      
      await ctx.db.$transaction(updates);
      
      return { success: true };
    }),
});