import { FastifyInstance } from "fastify";
import categoryRoutes from "./category.js";
import { config } from "config.js";
import authRoutes from "./auth.js";
import userRoutes from "./user.js";
import addressRoutes from "./address.js";
import mediaRoutes from "./media.js";
import productRoutes from "./product.js";
import interactionRoutes from "./interaction.js";

export default async function masterRouter(app: FastifyInstance) {
  await app.register(categoryRoutes, { prefix: "/categories" });
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(userRoutes, { prefix: "/users" });
  await app.register(addressRoutes, { prefix: "/addresses" });
  await app.register(mediaRoutes, { prefix: "/media" });
  await app.register(productRoutes, { prefix: "/products" });
  await app.register(interactionRoutes, { prefix: "/interactions" });

  app.get("/health", async () => {
    return { status: "online", environment: config.NODE_ENV };
  });

  app.log.info("[ROUTER] All API routes registered");
}
