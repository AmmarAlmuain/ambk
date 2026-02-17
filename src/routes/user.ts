import { FastifyInstance } from "fastify";
import {
  getMe,
  updateMe,
  getSellers,
  updateProfileBodySchema,
  UpdateProfileRequest,
} from "../controllers/user.js";

export default async function userRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/me", async (req, res) => {
    const result = await getMe(app, req);
    return res.status(result.statusCode).send(result);
  });

  app.patch(
    "/me",
    { schema: { body: updateProfileBodySchema } },
    async (req, res) => {
      const result = await updateMe(app, req as UpdateProfileRequest);
      return res.status(result.statusCode).send(result);
    },
  );

  app.get("/sellers", async (req, res) => {
    const result = await getSellers(app, req);
    return res.status(result.statusCode).send(result);
  });
}
