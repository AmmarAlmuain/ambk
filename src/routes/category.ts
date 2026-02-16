import { FastifyInstance } from "fastify";
import { getCategories } from "../controllers/category.js";
import { z } from "zod";

export default async function categoryRoutes(app: FastifyInstance) {
  app.get(
    "/",
    {
      schema: {
        description: "Get all product categories",
        tags: ["Categories"],
        response: {
          200: z.object({
            // Match our StandardResponse interface
            data: z.array(
              z.object({
                id: z.string().uuid(),
                name: z.string(),
                icon_url: z.string().nullable().optional(),
                created_at: z.string().optional(),
              }),
            ),
            error: z.null(),
            meta: z.object({
              version: z.string(),
              timestamp: z.string(),
              requestId: z.string(),
            }),
          }),
        },
      },
    },
    (request, reply) => getCategories(app, request, reply),
  );
}
