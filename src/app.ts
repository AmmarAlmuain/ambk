import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import { config } from "./config.js";
import supabasePlugin from "./plugins/supabase.js";
import { AppError, StandardResponse } from "./types/index.js";

const buildApp = async () => {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === "development" ? "info" : "warn",
      transport:
        config.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
      redact: ["req.headers.authorization", "req.body.password"],
    },
    disableRequestLogging: false,
    requestIdLogLabel: "requestId",
    genReqId: (req) =>
      req.headers["x-request-id"]?.toString() ||
      Math.random().toString(36).substring(2, 11),
  }).withTypeProvider<ZodTypeProvider>();

  app.log.info(`Initializing ${config.APP_NAME} v${config.APP_VERSION}`);

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(fastifyHelmet);
  await app.register(fastifyCors, {
    origin: true,
  });

  await app.register(supabasePlugin);

  app.setErrorHandler((error: AppError, request, reply) => {
    app.log.error(error);

    const statusCode = error.statusCode || 500;

    const errorResponse: StandardResponse = {
      data: null,
      error: {
        message: error.message || "Internal Server Error",
        code: error.code || "INTERNAL_SERVER_ERROR",
        details: error.validation || null,
      },
      meta: {
        version: config.APP_VERSION,
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    };

    return reply.status(statusCode).send(errorResponse);
  });

  app.addHook("preSerialization", async (request, reply, payload: any) => {
    const isStandard =
      payload &&
      typeof payload === "object" &&
      ("data" in payload || "error" in payload) &&
      "meta" in payload;

    if (isStandard) {
      return payload;
    }

    const successResponse: StandardResponse = {
      data: payload ?? null,
      error: null,
      meta: {
        version: config.APP_VERSION,
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    };

    return successResponse;
  });

  app.get("/health", async () => {
    return { status: "online", environment: config.NODE_ENV };
  });

  return app;
};

export default buildApp;
