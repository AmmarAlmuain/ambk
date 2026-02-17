import { FastifyInstance } from "fastify";
import {
  createProduct,
  getProducts,
  getProductById,
  createProductBodySchema,
  CreateProductRequest,
} from "../controllers/product.js";

export default async function productRoutes(app: FastifyInstance) {
  app.get("/", async (req, res) => {
    const result = await getProducts(app, req as any);
    return res.status(result.statusCode).send(result);
  });

  app.get("/:id", async (req, res) => {
    const result = await getProductById(app, req as any);
    return res.status(result.statusCode).send(result);
  });

  app.post(
    "/",
    {
      preHandler: [app.authenticate],
      schema: { body: createProductBodySchema },
    },
    async (req, res) => {
      const result = await createProduct(app, req as CreateProductRequest);
      return res.status(result.statusCode).send(result);
    },
  );
}
