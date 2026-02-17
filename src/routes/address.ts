import { FastifyInstance } from "fastify";
import {
  getAddresses,
  addAddress,
  deleteAddress,
  addressBodySchema,
} from "../controllers/address.js";

export default async function addressRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/", async (req, res) => {
    const result = await getAddresses(app, req);
    return res.status(result.statusCode).send(result);
  });

  app.post("/", { schema: { body: addressBodySchema } }, async (req, res) => {
    const result = await addAddress(app, req as any);
    return res.status(result.statusCode).send(result);
  });

  app.delete("/:id", async (req, res) => {
    const result = await deleteAddress(app, req as any);
    return res.status(result.statusCode).send(result);
  });
}
