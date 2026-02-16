import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../types/index.js";

export const getCategories = async (
  app: FastifyInstance,
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  // PRO TIP: Explicitly list columns instead of "*"
  const { data, error } = await app.supabase
    .from("categories")
    .select("id, name, icon_url, created_at")
    .order("name", { ascending: true });

  if (error) {
    app.log.error(error, "[CATEGORIES] Supabase fetch error");

    const appError = new Error("Failed to retrieve categories") as AppError;
    appError.statusCode = 500;
    appError.code = error.code;
    throw appError;
  }

  return data ?? [];
};
