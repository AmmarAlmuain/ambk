import { FastifyInstance, FastifyRequest } from "fastify";
import { createResponse } from "../utils/response.js";
import { config } from "../config.js";
import { StandardResponse } from "../types/index.js";
import { z } from "zod";

export const ImagePurposeSchema = z.enum([
  "avatar",
  "product",
  "banner",
  "others",
]);
export type ImagePurpose = z.infer<typeof ImagePurposeSchema>;

export const uploadImage = async (
  app: FastifyInstance,
  request: FastifyRequest,
): Promise<StandardResponse<any>> => {
  try {
    const querySchema = z.object({
      purpose: ImagePurposeSchema.default("others"),
    });

    const { purpose } = querySchema.parse(request.query);

    const data = await request.file();
    if (!data) {
      return createResponse(
        null,
        { message: "No file uploaded", code: "NO_FILE" },
        request.id,
        400,
      );
    }

    const formData = new FormData();
    const fileBuffer = await data.toBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    const blob = new Blob([uint8Array], { type: data.mimetype });

    formData.append("file", blob, data.filename);
    formData.append("fileName", data.filename);
    formData.append("folder", `/${purpose}s`);
    formData.append("useUniqueFileName", "true");

    const authHeader = `Basic ${Buffer.from(config.IMAGEKIT_PRIVATE_KEY + ":").toString("base64")}`;

    const response = await fetch(
      "https://upload.imagekit.io/api/v1/files/upload",
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization: authHeader,
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      return createResponse(
        null,
        { message: result.message, code: "IMAGEKIT_ERROR" },
        request.id,
        500,
      );
    }

    return createResponse(
      { url: result.url, fileId: result.fileId },
      null,
      request.id,
      201,
    );
  } catch (err: any) {
    return createResponse(
      null,
      { message: err.message, code: "UPLOAD_FAILED" },
      request.id,
      500,
    );
  }
};
