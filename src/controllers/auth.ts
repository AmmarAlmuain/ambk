import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { config } from "../config.js";
import { createResponse } from "../utils/response.js";
import { StandardResponse } from "../types/index.js";

export const requestOtpBodySchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
});

export const verifyOtpBodySchema = z.object({
  phoneNumber: z.string().min(10),
  code: z.string().length(6, "OTP must be exactly 6 digits"),
});

export type RequestOtpRequest = FastifyRequest<{
  Body: z.infer<typeof requestOtpBodySchema>;
}>;

export type VerifyOtpRequest = FastifyRequest<{
  Body: z.infer<typeof verifyOtpBodySchema>;
}>;

export const requestOtp = async (
  app: FastifyInstance,
  request: RequestOtpRequest,
): Promise<StandardResponse<any>> => {
  const { phoneNumber } = request.body;
  const now = new Date();
  const expiry = new Date(now.getTime() + 10 * 60000).toISOString();
  try {
    const { data: existingOtp, error: fetchError } = await app.supabase
      .from("otps")
      .select("id, code, expires_at")
      .eq("identifier", phoneNumber)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let finalCode: string;
    const isExpired = existingOtp
      ? new Date(existingOtp.expires_at) < now
      : true;

    if (!existingOtp || isExpired) {
      finalCode = Math.floor(100000 + Math.random() * 900000).toString();

      const { error: dbError } = existingOtp
        ? await app.supabase
            .from("otps")
            .update({ code: finalCode, expires_at: expiry })
            .eq("id", existingOtp.id)
        : await app.supabase.from("otps").insert([
            {
              identifier: phoneNumber,
              code: finalCode,
              expires_at: expiry,
              type: "PHONE_NUMBER_VERIFICATION",
              updated_at: new Date().toISOString(),
            },
          ]);

      if (dbError) throw dbError;
    } else {
      finalCode = existingOtp.code;
      await app.supabase
        .from("otps")
        .update({ expires_at: expiry })
        .eq("id", existingOtp.id);
    }

    try {
      await fetch("https://api.otpiq.com/api/sms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.OTPIQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: `964${phoneNumber}`,
          smsType: "verification",
          provider: "whatsapp-sms",
          verificationCode: finalCode,
        }),
      });
    } catch (smsErr) {
      app.log.error(smsErr, "[AUTH] SMS Gateway Network Error");
    }
    return createResponse(
      {
        phoneNumber,
        code:
          config.NODE_ENV === "development" ? finalCode : "SENT_SUCCESSFULLY",
      },
      null,
      request.id,
      200,
    );
  } catch (err: any) {
    app.log.error(err, "[AUTH] Request OTP Internal Failure");
    return createResponse(
      null,
      {
        message: err.message || "Failed to process OTP request",
        code: "OTP_REQUEST_FAILED",
      },
      request.id,
      400,
    );
  }
};

export const verifyOtp = async (
  app: FastifyInstance,
  request: VerifyOtpRequest,
): Promise<StandardResponse<any>> => {
  const { phoneNumber, code } = request.body;

  try {
    const { data: otpRecord, error: otpError } = await app.supabase
      .from("otps")
      .select("*")
      .eq("identifier", phoneNumber)
      .eq("code", code)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (otpError || !otpRecord) {
      return createResponse(
        null,
        {
          message: "Invalid or expired verification code",
          code: "INVALID_OTP",
        },
        request.id,
        401,
      );
    }

    await app.supabase.from("otps").delete().eq("id", otpRecord.id);

    const { data: account, error: accError } = await app.supabase
      .from("accounts")
      .upsert(
        { phone_number: phoneNumber, updated_at: new Date().toISOString() },
        { onConflict: "phone_number" },
      )
      .select()
      .single();

    if (accError) throw accError;

    const token = app.jwt.sign({
      id: account.id,
      phone: account.phone_number,
    });

    return createResponse(
      {
        user: account,
        token,
        message: "Verification successful",
      },
      null,
      request.id,
      200,
    );
  } catch (err: any) {
    app.log.error(err, "[AUTH] Verify OTP Internal Failure");
    return createResponse(
      null,
      {
        message:
          err.message || "An unexpected error occurred during verification",
        code: "VERIFICATION_FAILED",
      },
      request.id,
      500,
    );
  }
};
