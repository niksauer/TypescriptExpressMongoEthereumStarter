import dotenv from "dotenv";
import fs from "fs";
import { ILogger } from "../../../interfaces/model/ILogger";

export enum EnvironmentFileError {
    FileNotFound,
    VariableNotFound,
    NumberRequired,
    BooleanRequired, 
}

export interface EnvironmentFileOptions {
    fileName: string;
}

export abstract class EnvironmentFile {
    
    // MARK: - Public Properties
    readonly environmentName: string;

    // MARK: - Protected Properties
    protected logger: ILogger;

    // MARK: - Initialization
    constructor(options: EnvironmentFileOptions, environmentName: string, logger: ILogger) {        
        this.environmentName = environmentName;
        this.logger = logger;
        this.loadEnvFile(options.fileName);
    }

    // MARK: - Private Methods
    private loadEnvFile(fileName: string) {
        if (fs.existsSync(fileName)) {
            this.logger.debug(`Using ${fileName} file to retrieve ${this.environmentName} environment variables`);
            dotenv.config({ path: fileName });
        } else {
            throw EnvironmentFileError.FileNotFound;
        }
    }

    // MARK: - Protected Methods
    protected loadRequiredValue(key: string): string {
        return this.loadValue(key, false)!;
    }

    protected loadValue(key: string, optional?: boolean): string | undefined {
        const value = process.env[key];

        if (!value) {
            if (optional) {
                return undefined;
            }

            this.logger.error(`No ${key.toLowerCase().split("_").join(" ")} specified. Set ${key} environment variable`);
            throw EnvironmentFileError.VariableNotFound;
        }

        return (value as any);
    }   

}

export function parseBoolean(string: string): boolean {
    switch (string.toLowerCase()) {
        case "true":
            return true;
        case "false":
            return false;
        default:
            throw EnvironmentFileError.BooleanRequired;
    }
}

export function parseInt(string: string): number {
    const number = Number.parseInt(string);
        
    if (isNaN(number)) {
        throw EnvironmentFileError.NumberRequired;
    } 
    
    return number;
}

export function parseOptionalBoolean(string: string | undefined): boolean | undefined {
    if (string) {
        return parseBoolean(string);
    }
}