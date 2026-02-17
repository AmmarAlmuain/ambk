import { FastifyInstance } from "fastify";
import { getCategories } from "../controllers/category.js";

export default async function categoryRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const result = await getCategories(app, request);
    return reply.status(result.statusCode).send(result);
  });
}
