import { FastifyInstance } from "fastify";
import {
  requestOtp,
  requestOtpBodySchema,
  RequestOtpRequest,
  verifyOtp,
  verifyOtpBodySchema,
  VerifyOtpRequest,
} from "../controllers/auth.js";

export default async function authRoutes(app: FastifyInstance) {
  app.post(
    "/request-otp",
    {
      schema: { body: requestOtpBodySchema },
    },
    async (req, res) => {
      const result = await requestOtp(app, req as RequestOtpRequest);
      return res.status(result.statusCode).send(result);
    },
  );

  app.post(
    "/verify-otp",
    {
      schema: { body: verifyOtpBodySchema },
    },
    async (req, res) => {
      const result = await verifyOtp(app, req as VerifyOtpRequest);
      return res.status(result.statusCode).send(result);
    },
  );
}
