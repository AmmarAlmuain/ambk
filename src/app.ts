import Fastify, { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import { config } from "./config.js";
import supabasePlugin from "./plugins/supabase.js";
import masterRouter from "./routes/index.js";
import { createResponse } from "./utils/response.js";
import fastifyJwt from "@fastify/jwt";
import multipart from "@fastify/multipart";

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

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode || 500;

    const formattedError = createResponse(
      null,
      {
        message: error.message,
        code: error.code || "VALIDATION_ERROR",
        details: (error as any).validation || null,
      },
      request.id,
    );

    return reply.status(statusCode).send(formattedError);
  });

  app.log.info(`Initializing ${config.APP_NAME} v${config.APP_VERSION}`);

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });
  await app.register(fastifyHelmet);
  await app.register(fastifyCors, {
    origin: true,
  });
  app.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    messages: {
      badRequestErrorMessage: "Format is Authorization: Bearer [token]",
      noAuthorizationInHeaderMessage: "No Authorization header was found",
      authorizationTokenExpiredMessage: "Token expired",
      authorizationTokenInvalid: (err) => `Token is invalid: ${err.message}`,
    },
  });
  app.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err: any) {
        const authError = createResponse(
          null,
          {
            message: "You must be logged in to access this",
            code: "UNAUTHORIZED",
            details: err.message,
          },
          request.id,
          401,
        );

        return reply.status(401).send(authError);
      }
    },
  );

  await app.register(supabasePlugin);
  await app.register(masterRouter, { prefix: config.API_BASE });

  return app;
};

export default buildApp;
