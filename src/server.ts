import { Server } from "http";
import { ILogger } from "./interfaces/model/ILogger";
import { DependencyContainer } from "./make";
import { prepareEnvironment } from "./environment";
import { MongoDBStateStorage } from "./model/util/storage/MongoDBStateStorage";
import { AppState } from "./model/util/config/state/AppState";

let logger: ILogger;
let server: Server | undefined;

// MARK: - Helper
function shutdown(exitCode: number) {
    try {
        server?.close();
        logger?.info("Shutdown complete");
        process.exit(exitCode);
    } catch (error) {
        logger?.error("Error during shutdown", error);
        process.exit(1);
    }
}

function handleExit() {
    process.on("uncaughtException", (error: Error) => {
        logger?.error("Uncaught exception", error);
        logger?.error(error as any);
        shutdown(1);
    });
    process.on("unhandledRejection", (reason: {} | null | undefined) => {
        logger?.error("Unhandled Rejection at promise");
        logger?.error(reason as any);
        shutdown(2);
    });
    process.on("SIGINT", () => {
        logger?.info("Caught SIGINT");
        shutdown(128 + 2);
    });
    process.on("SIGTERM", () => {
        logger?.info("Caught SIGTERM");
        shutdown(128 + 2);
    });
    process.on("exit", () => {
        logger?.info("Exiting");
    });
}

// MARK: - Server Startup
async function run() {
    handleExit();
        
    const dependencyContainer = DependencyContainer.shared;

    await dependencyContainer.setup({
        appConfig: async () => {
            return {
                fileName: "config/app.env"
            };
        },
        secretConfig: async () => {
            return {
                fileName: "config/secret.env"
            };
        },
        connectionConfig: async (appConfig) => {
            return {
                fileName: "config/connection.env"
            };
        },
        bootstrapConfig: async () => {
            return {
                fileName: "config/bootstrap.env"
            };
        },
        appStateStorage: new MongoDBStateStorage<AppState>("appState")
    });

    logger = dependencyContainer.makeLogger();

    await prepareEnvironment(dependencyContainer, logger, false);

    const config = dependencyContainer.makeAppConfig();
    const app = dependencyContainer.makeApp();

    logger.debug(`Starting server on port ${config.port}`);

    server = (await app.setup()).listen(config.port, () => {
        logger.info(`App is running at http://localhost:${config.port} in ${config.stage} mode`);
        logger.info("Press CTRL-C to stop");
    });
}

run();

