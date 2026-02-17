import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { createResponse } from "../utils/response.js";
import { StandardResponse } from "../types/index.js";

export const postCommentBodySchema = z.object({
  product_id: z.string().uuid(),
  message: z.string().min(1).max(500),
  parent_id: z.string().uuid().nullable().optional(),
});

export type PostCommentRequest = FastifyRequest<{
  Body: z.infer<typeof postCommentBodySchema>;
  Params: { productId: string };
}>;

export const getComments = async (
  app: FastifyInstance,
  request: FastifyRequest<{ Params: { productId: string } }>,
): Promise<StandardResponse<any>> => {
  try {
    const { productId } = request.params;

    const { data, error } = await app.supabase
      .from("interactions")
      .select(
        `
        id, 
        sender_id, 
        product_id,
        message, 
        created_at, 
        parent_id,
        sender:accounts ( 
            full_name, 
            avatar_url 
        )
      `,
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return createResponse(data || [], null, request.id, 200);
  } catch (err: any) {
    return createResponse(
      null,
      { message: err.message, code: "FETCH_COMMENTS_FAILED" },
      request.id,
      500,
    );
  }
};

export const postComment = async (
  app: FastifyInstance,
  request: PostCommentRequest,
): Promise<StandardResponse<any>> => {
  try {
    const userId = request.user.id;
    const { product_id, message, parent_id } = request.body;

    const { data, error } = await app.supabase
      .from("interactions")
      .insert({
        sender_id: userId,
        product_id,
        message,
        parent_id: parent_id || null,
      })
      .select(
        `
        *,
        sender:accounts (full_name, avatar_url)
      `,
      )
      .single();

    if (error) throw error;

    return createResponse(data, null, request.id, 201);
  } catch (err: any) {
    return createResponse(
      null,
      { message: err.message, code: "POST_COMMENT_FAILED" },
      request.id,
      400,
    );
  }
};
