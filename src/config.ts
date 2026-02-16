import { z } from "zod";
import "dotenv/config";
import { logger } from "./utils/logger.js";

export const schema = z.object({
  APP_NAME: z.string().default("MarketplaceAPI"),
  APP_VERSION: z.string().default("1.0.0"),
  API_PREFIX: z.string().default("/api"),
  API_VERSION: z.string().default("v1"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  SUPABASE_URL: z.string().url({ message: "Invalid Supabase URL" }),
  SUPABASE_ANON_KEY: z
    .string()
    .min(1, { message: "Supabase Anon Key is required" }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof schema>;

const result = schema.safeParse(process.env);

if (!result.success) {
  logger.error(
    {
      configErrors: result.error.flatten().fieldErrors,
    },
    "[CONFIG] Validation failed. Please check your .env file.",
  );
  process.exit(1);
}

export const config = {
  ...result.data,
  API_BASE: `/${result.data.API_PREFIX}/${result.data.API_VERSION}`,
};

export const envOptions = {
  dotenv: true,
  data: process.env,
};
