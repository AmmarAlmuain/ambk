import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { createResponse } from "../utils/response.js";
import { StandardResponse } from "../types/index.js";

export const createProductBodySchema = z.object({
  category_id: z.string().uuid(),
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  price_iqd: z.number().positive(),
  main_image: z.string().url(),
});

export type CreateProductRequest = FastifyRequest<{
  Body: z.infer<typeof createProductBodySchema>;
  Params: { id: string };
  Querystring: { sellerId?: string; categoryId?: string };
}>;

export const createProduct = async (
  app: FastifyInstance,
  request: CreateProductRequest,
): Promise<StandardResponse<any>> => {
  try {
    const userId = request.user.id;
    const body = request.body;

    const { data: account } = await app.supabase
      .from("accounts")
      .select("is_seller")
      .eq("id", userId)
      .single();

    if (!account?.is_seller) {
      return createResponse(
        null,
        {
          message: "Only registered sellers can list products",
          code: "NOT_A_SELLER",
        },
        request.id,
        403,
      );
    }

    const { data, error } = await app.supabase
      .from("products")
      .insert([
        {
          ...body,
          seller_id: userId,
          availability_status: "in_stock",
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return createResponse(data, null, request.id, 201);
  } catch (err: any) {
    return createResponse(
      null,
      { message: err.message, code: "CREATE_PRODUCT_FAILED" },
      request.id,
      400,
    );
  }
};

export const getProducts = async (
  app: FastifyInstance,
  request: CreateProductRequest,
): Promise<StandardResponse<any>> => {
  try {
    const { sellerId, categoryId } = request.query;

    let query = app.supabase
      .from("products")
      .select("*, seller:accounts(full_name, avatar_url, trust_score)")
      .eq("availability_status", "in_stock")
      .order("created_at", { ascending: false });

    if (sellerId) query = query.eq("seller_id", sellerId);
    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, error } = await query.limit(50);

    if (error) throw error;
    return createResponse(data || [], null, request.id, 200);
  } catch (err: any) {
    return createResponse(
      null,
      { message: err.message, code: "FETCH_PRODUCTS_FAILED" },
      request.id,
      500,
    );
  }
};

export const getProductById = async (
  app: FastifyInstance,
  request: CreateProductRequest,
): Promise<StandardResponse<any>> => {
  try {
    const { id } = request.params;

    const { data, error } = await app.supabase
      .from("products")
      .select(
        `
        *,
        category:categories(name),
        seller:accounts (
          full_name,
          phone_number,
          avatar_url,
          trust_score,
          address:addresses(*)
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      const isNotFound = error.code === "PGRST116";
      return createResponse(
        null,
        {
          message: isNotFound ? "Product not found" : error.message,
          code: isNotFound ? "NOT_FOUND" : "DB_ERROR",
        },
        request.id,
        isNotFound ? 404 : 400,
      );
    }

    return createResponse(data, null, request.id, 200);
  } catch (err: any) {
    return createResponse(
      null,
      { message: err.message, code: "SERVER_ERROR" },
      request.id,
      500,
    );
  }
};
