import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { createResponse } from "../utils/response.js";
import { StandardResponse } from "../types/index.js";

export const updateProfileBodySchema = z.object({
  full_name: z.string().min(3).optional(),
  avatar_url: z.string().url().optional().nullable(),
  bio: z.string().max(160).optional(),
  is_seller: z.boolean().optional(),
});

export type UpdateProfileRequest = FastifyRequest<{
  Body: z.infer<typeof updateProfileBodySchema>;
}>;

export const getMe = async (
  app: FastifyInstance,
  request: FastifyRequest,
): Promise<StandardResponse<any>> => {
  try {
    const { data: user, error } = await app.supabase
      .from("accounts")
      .select("*")
      .eq("id", request.user.id)
      .single();

    if (error || !user) {
      return createResponse(
        null,
        { message: "User not found", code: "USER_NOT_FOUND" },
        request.id,
        404,
      );
    }

    return createResponse(user, null, request.id, 200);
  } catch (err: any) {
    return createResponse(
      null,
      { message: err.message, code: "SERVER_ERROR" },
      request.id,
      500,
    );
  }
};

export const updateMe = async (
  app: FastifyInstance,
  request: UpdateProfileRequest,
): Promise<StandardResponse<any>> => {
  try {
    const updates = request.body;

    if (updates.is_seller === true) {
      const { data: currentUser } = await app.supabase
        .from("accounts")
        .select("full_name")
        .eq("id", request.user.id)
        .single();

      const cleanName = currentUser?.full_name?.trim() || "";
      if (!cleanName || cleanName === "User") {
        return createResponse(
          null,
          {
            message: "Please complete your full name before becoming a seller.",
            code: "PROFILE_INCOMPLETE",
          },
          request.id,
          400,
        );
      }
    }

    const { data: updatedUser, error } = await app.supabase
      .from("accounts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      })
      .eq("id", request.user.id)
      .select()
      .single();

    if (error) throw error;

    return createResponse(updatedUser, null, request.id, 200);
  } catch (err: any) {
    return createResponse(
      null,
      { message: err.message, code: "UPDATE_FAILED" },
      request.id,
      400,
    );
  }
};

export const getSellers = async (
  app: FastifyInstance,
  request: FastifyRequest,
): Promise<StandardResponse<any>> => {
  try {
    const { data, error } = await app.supabase
      .from("accounts")
      .select("*, address:addresses(*)")
      .eq("is_seller", true)
      .order("trust_score", { ascending: false });

    if (error) throw error;

    return createResponse(data || [], null, request.id, 200);
  } catch (err: any) {
    return createResponse(
      null,
      { message: err.message, code: "FETCH_SELLERS_FAILED" },
      request.id,
      500,
    );
  }
};
