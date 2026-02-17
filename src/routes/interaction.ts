import { FastifyInstance } from "fastify";
import {
  getComments,
  postComment,
  postCommentBodySchema,
  PostCommentRequest,
} from "../controllers/interaction.js";

export default async function interactionRoutes(app: FastifyInstance) {
  app.get("/product/:productId", async (req, res) => {
    const result = await getComments(app, req as any);
    return res.status(result.statusCode).send(result);
  });

  app.post(
    "/",
    {
      preHandler: [app.authenticate],
      schema: { body: postCommentBodySchema },
    },
    async (req, res) => {
      const result = await postComment(app, req as PostCommentRequest);
      return res.status(result.statusCode).send(result);
    },
  );
}
