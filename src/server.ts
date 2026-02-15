import buildApp from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";

const start = async () => {
  const app = await buildApp();

  try {
    await app.listen({
      port: config.PORT,
      host: "0.0.0.0",
    });

    app.log.info(
      `[SERVER] ${config.APP_NAME} v${config.APP_VERSION} startup successful`,
    );
  } catch (err) {
    logger.error(err, "[SERVER] Failed to start");
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "[PROCESS] Unhandled Rejection detected");
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.fatal(error, "[PROCESS] CRITICAL: Uncaught Exception");
  process.exit(1);
});

start();
