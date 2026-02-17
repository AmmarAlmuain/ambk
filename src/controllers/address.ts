import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { createResponse } from "../utils/response.js";
import { StandardResponse } from "../types/index.js";

// Validation Schema
export const addressBodySchema = z.object({
  governorate: z.string(),
  city_district: z.string().min(2),
  street_address: z.string().min(5),
  nearest_landmark: z.string().min(2),
  lat_long: z.string().optional().nullable(),
  is_default: z.boolean().optional().default(false),
});

export type AddressRequest = FastifyRequest<{
  Body: z.infer<typeof addressBodySchema>;
  Params: { id: string };
}>;

const clearDefaults = async (app: FastifyInstance, userId: string) => {
  const { error } = await app.supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("account_id", userId);
  if (error) throw error;
};

export const getAddresses = async (
  app: FastifyInstance,
  request: FastifyRequest,
): Promise<StandardResponse<any>> => {
  try {
    const { data, error } = await app.supabase
      .from("addresses")
      .select("*")
      .eq("account_id", request.user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return createResponse(data || [], null, request.id, 200);
  } catch (err: any) {
    return createResponse(
      null,
      { message: err.message, code: "FETCH_ADDRESSES_FAILED" },
      request.id,
      500,
    );
  }
};

export const addAddress = async (
  app: FastifyInstance,
  request: AddressRequest,
): Promise<StandardResponse<any>> => {
  try {
    const details = request.body;
    const userId = request.user.id;

    const { data: existing } = await app.supabase
      .from("addresses")
      .select("id")
      .eq("account_id", userId)
      .eq("governorate", details.governorate)
      .eq("city_district", details.city_district)
      .eq("street_address", details.street_address)
      .maybeSingle();

    if (existing) {
      return createResponse(
        null,
        { message: "This address already exists", code: "ADDRESS_EXISTS" },
        request.id,
        400,
      );
    }

    if (details.is_default) {
      await clearDefaults(app, userId);
    }

    const { data, error } = await app.supabase
      .from("addresses")
      .insert([{ ...details, account_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return createResponse(data, null, request.id, 201);
  } catch (err: any) {
    return createResponse(
      null,
      { message: err.message, code: "ADD_ADDRESS_FAILED" },
      request.id,
      400,
    );
  }
};

export const deleteAddress = async (
  app: FastifyInstance,
  request: AddressRequest,
): Promise<StandardResponse<any>> => {
  try {
    const { error } = await app.supabase
      .from("addresses")
      .delete()
      .eq("id", request.params.id)
      .eq("account_id", request.user.id);

    if (error) throw error;
    return createResponse({ success: true }, null, request.id, 200);
  } catch (err: any) {
    return createResponse(
      null,
      { message: err.message, code: "DELETE_FAILED" },
      request.id,
      400,
    );
  }
};
