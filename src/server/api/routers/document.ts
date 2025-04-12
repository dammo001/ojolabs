import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { GoogleGenerativeAI } from "@google/generative-ai";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


export const documentRouter = createTRPCRouter({
  getAll: protectedProcedure
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
      
      return ctx.db.document.findMany({
        where: { caseId },
        orderBy: { uploadedAt: "desc" },
        include: { section: true },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { id } = input;
      
      const document = await ctx.db.document.findUnique({
        where: { id },
        include: {
          case: {
            select: { userId: true },
          },
        },
      });
      
      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }
      
      if (document.case.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized to access this document",
        });
      }
      
      return document;
    }),

  // This handles the client-side upload information after the file has been uploaded
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        fileUrl: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
        caseId: z.string(),
        sectionId: z.string().optional(),
        content: z.string().optional(), // Document content for AI summarization
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, fileUrl, fileType, fileSize, caseId, sectionId, content } = input;
      
      // Verify case ownership
      const caseExists = await ctx.db.case.findUnique({
        where: { id: caseId },
        select: { userId: true },
      });
      
      if (!caseExists || caseExists.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized to upload to this case",
        });
      }
      
      // Generate AI summary if content is provided
      let summary = null;
      if (content) {
        try {
          const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `Summarize the following legal document in a concise, professional manner highlighting key points:\n\n${content}`,
            max_tokens: 500,
            temperature: 0.3,
          });
          
          summary = response.data.choices[0]?.text?.trim() || null;
        } catch (error) {
          console.error("Error generating document summary:", error);
          // Continue without summary if AI fails
        }
      }
      
      // Create document record
      return ctx.db.document.create({
        data: {
          name,
          fileUrl,
          fileType,
          fileSize,
          summary,
          case: {
            connect: { id: caseId },
          },
          ...(sectionId && {
            section: {
              connect: { id: sectionId },
            },
          }),
        },
      });
    }),

  // Update document details and optionally move to a different section
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        sectionId: z.string().nullable().optional(),
        summary: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, sectionId, summary } = input;
      
      // Verify document ownership
      const document = await ctx.db.document.findUnique({
        where: { id },
        include: {
          case: {
            select: { userId: true },
          },
        },
      });
      
      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }
      
      if (document.case.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized to update this document",
        });
      }
      
      return ctx.db.document.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(summary && { summary }),
          ...(sectionId !== undefined && {
            section: sectionId ? { connect: { id: sectionId } } : { disconnect: true },
          }),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      
      // Verify document ownership
      const document = await ctx.db.document.findUnique({
        where: { id },
        include: {
          case: {
            select: { userId: true },
          },
        },
      });
      
      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }
      
      if (document.case.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized to delete this document",
        });
      }
      
      // Delete the document record (file deletion would be handled separately)
      return ctx.db.document.delete({
        where: { id },
      });
    }),

  generateSummary: protectedProcedure
    .input(z.object({ content: z.string(), documentId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { content, documentId } = input;
      
      if (documentId) {
        // Verify document ownership if documentId is provided
        const document = await ctx.db.document.findUnique({
          where: { id: documentId },
          include: {
            case: {
              select: { userId: true },
            },
          },
        });
        
        if (!document) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }
        
        if (document.case.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized for this document",
          });
        }
      }
      
      try {
        const response = await openai.createCompletion({
          model: "text-davinci-003",
          prompt: `Summarize the following legal document in a concise, professional manner highlighting key points:\n\n${content}`,
          max_tokens: 500,
          temperature: 0.3,
        });
        
        const summary = response.data.choices[0]?.text?.trim() || "";
        
        // Update document with summary if documentId is provided
        if (documentId) {
          await ctx.db.document.update({
            where: { id: documentId },
            data: { summary },
          });
        }
        
        return { summary };
      } catch (error) {
        console.error("Error generating document summary:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate summary",
        });
      }
    }),
});