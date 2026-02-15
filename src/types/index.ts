import { FastifyError } from "fastify";
import { ZodIssue } from "zod";

export type AppError = FastifyError & {
  validation?: ZodIssue[];
};

export interface StandardResponse<T = unknown> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: ZodIssue[] | unknown | null;
  } | null;
  meta: {
    version: string;
    timestamp: string;
    requestId?: string;
  };
}
