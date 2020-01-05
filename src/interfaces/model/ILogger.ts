import { Stage } from "../../model/util/config/AppConfig";

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface ILogger {
    stage: Stage;
    debug(message: string, ...meta: any[]): void;
    info(message: string, ...meta: any[]): void;
    warn(message: string, ...meta: any[]): void;
    error(message: string, ...meta: any[]): void;
}