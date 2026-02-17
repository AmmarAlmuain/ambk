import { FastifyInstance } from "fastify";
import { uploadImage } from "../controllers/media.js";

export default async function mediaRoutes(app: FastifyInstance) {
  // Protect uploads so only logged-in users can use your bandwidth
  app.addHook("preHandler", app.authenticate);

  app.post("/upload", async (req, res) => {
    const result = await uploadImage(app, req);
    return res.status(result.statusCode).send(result);
  });
}
