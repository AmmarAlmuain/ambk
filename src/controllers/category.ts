import { FastifyInstance, FastifyRequest } from "fastify";
import { createResponse } from "../utils/response.js";
import { StandardResponse } from "../types/index.js";

export const getCategories = async (
  app: FastifyInstance,
  request: FastifyRequest,
): Promise<StandardResponse<any>> => {
  try {
    const { data, error } = await app.supabase
      .from("categories")
      .select("id, name, icon_url, created_at")
      .order("name", { ascending: true });

    if (error) {
      app.log.error(error, "[CATEGORIES] Supabase fetch error");
      return createResponse(
        null,
        { message: "Failed to retrieve categories", code: error.code },
        request.id,
        500,
      );
    }

    return createResponse(data ?? [], null, request.id, 200);
  } catch (err: any) {
    app.log.error(err, "[CATEGORIES] Critical failure");
    return createResponse(
      null,
      { message: err.message || "Internal Server Error", code: "SERVER_ERROR" },
      request.id,
      500,
    );
  }
};
