import { Stage } from "../config/AppConfig";
import { ILogger } from "../../../interfaces/model/ILogger";
import loglevel, { LogLevelDesc } from "loglevel";
import { inject, singleton } from "tsyringe";
import { Dependency } from "../../../make";

@singleton()
export class ConsoleLogger implements ILogger {

    // MARK: - Public Properties
    get stage(): Stage {
        return this._stage;
    }

    set stage(newValue: Stage) {
        this._stage = newValue;
        this.updateLogLevel();
    }
    
    // MARK: - Private Properties
    private logger: loglevel.RootLogger;
    private _stage: Stage;

    private logLevel: LogLevelDesc;
    private isInitialized = false;

    // MARK: - Initialization
    constructor(
        @inject(Dependency.Stage) stage: Stage
    ) {
        this.logger = loglevel;
        this._stage = stage;
        
        this.logLevel = loglevel.levels.DEBUG;
        this.updateLogLevel();
        this.isInitialized = true;
    }
    
    // MARK: - Public Methods
    // MARK: Logging
    debug(message: string) {
        this.logger.debug(message);
    }

    info(message: string) {
        this.logger.info(message);
    }

    warn(message: string) {
        this.logger.warn(message);
    }

    error(message: string) {
        this.logger.error(message);
    }

    // MARK: - Private Methods
    private updateLogLevel() {              
        let newLoglevel: LogLevelDesc;

        if (this.stage != Stage.Production) {
            newLoglevel = loglevel.levels.DEBUG;
        } else {
            newLoglevel = loglevel.levels.WARN;
        }

        if (this.isInitialized && newLoglevel == this.logLevel) {
            return;
        }

        loglevel.setLevel(newLoglevel, false);
        this.logLevel = newLoglevel;

        if (!this.isInitialized) {
            this.logger.debug(`Initialized logging at level ${newLoglevel}`);
        } else {
            this.logger.debug(`Set logging level to ${newLoglevel}`);
        }   
    }

}