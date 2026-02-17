import { SupabaseClient } from "@supabase/supabase-js/dist/index.mjs";
import { FastifyError } from "fastify";
import { ZodIssue } from "zod";

declare module "fastify" {
  interface FastifyInstance {
    supabase: SupabaseClient;
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }

  interface FastifyRequest {
    user: {
      id: string;
      phone: string;
    };
  }
}

export type AppError = FastifyError & {
  validation?: ZodIssue[];
};

export interface StandardResponse<T = unknown> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: any;
  } | null;
  meta: {
    version: string;
    timestamp: string;
    requestId?: string;
  };
  statusCode: number;
}
