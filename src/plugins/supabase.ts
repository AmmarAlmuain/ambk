import fp from "fastify-plugin";
import { createClient } from "@supabase/supabase-js";
import { FastifyInstance } from "fastify";
import { config } from "../config.js";

async function supabasePlugin(app: FastifyInstance) {
  const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

  try {
    const { error } = await supabase
      .from("accounts")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      app.log.warn(`[SUPABASE] Ping warning: ${error.message}`);
    }
  } catch (err) {
    app.log.error(err, "[SUPABASE] Connection failed during initialization");
  }

  app.decorate("supabase", supabase);

  app.addHook("onClose", async () => {
    app.log.info("[SUPABASE] Closing connections...");
  });

  app.log.info("[SUPABASE] Plugin registered and verified");
}

export default fp(supabasePlugin);
