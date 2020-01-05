// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IDaemon {
    readonly isRunning: boolean;
    start(): Promise<void>;
    stop(): Promise<void>;
}