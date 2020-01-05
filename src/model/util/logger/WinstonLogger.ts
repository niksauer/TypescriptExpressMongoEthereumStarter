import winston from "winston";
import { Stage } from "../config/AppConfig";
import { ILogger } from "../../../interfaces/model/ILogger";
import { inject, singleton } from "tsyringe";
import { Dependency } from "../../../make";
import { Error, ErrorReason } from "../error/Error";

@singleton()
export class WinstonLogger implements ILogger {

    // MARK: - Public Properties
    stage: Stage;
    
    // MARK: - Private Properties
    private logger: winston.Logger;

    // MARK: - Initialization
    constructor(
        @inject(Dependency.Stage) stage: Stage
    ) {
        this.stage = stage;

        this.logger = winston.createLogger({
            transports: [
                new winston.transports.Console({
                    level: stage == Stage.Production ? "error" : "debug"
                }),
                // new winston.transports.File({ filename: "debug.log", level: "debug" })
            ]
        } as winston.LoggerOptions);

        if (stage != Stage.Production) {
            this.logger.debug("Logging initialized at debug level");
        }
    }
    
    // MARK: - Public Methods
    debug(message: string) {
        this.logger.debug(message);
    }

    info(message: string) {
        this.logger.debug("hello", { });
        this.logger.info(message);
    }

    warn(message: string) {
        this.logger.warn(message);
    }

    error(message: string) {
        this.logger.error(message);
    }

    // MARK: - Private Methods
    private updateLogLevel(Stage: Stage) {
        throw new Error(ErrorReason.NotImplemented);
    }

}