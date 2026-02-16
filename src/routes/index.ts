import { FastifyInstance } from "fastify";
import categoryRoutes from "./category.js";
import { config } from "config.js";
// import productRoutes from "./product.js"; // Future routes

export default async function masterRouter(app: FastifyInstance) {
  /**
   * We register all sub-routes here.
   * The prefix here is RELATIVE to the prefix we set in app.ts
   */

  await app.register(categoryRoutes, { prefix: "/categories" });
  app.get("/health", async () => {
    return { status: "online", environment: config.NODE_ENV };
  });

  // Example of future routes:
  // await app.register(productRoutes, { prefix: "/products" });
  // await app.register(authRoutes, { prefix: "/auth" });

  app.log.info("[ROUTER] All API routes registered");
}
