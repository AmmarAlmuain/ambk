import { StandardResponse } from "../types/index.js";
import { config } from "../config.js";

export const createResponse = <T>(
  data: T | null,
  error: any = null,
  requestId?: string,
  statusCode: number = 200,
): StandardResponse<T> => {
  return {
    data,
    error: error
      ? {
          message: error.message,
          code: error.code || "INTERNAL_ERROR",
          details: error.details || null,
        }
      : null,
    meta: {
      version: config.APP_VERSION,
      timestamp: new Date().toISOString(),
      requestId,
    },
    statusCode,
  };
};
