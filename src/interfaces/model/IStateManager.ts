// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IStateManager<T> {
    readonly state: T | undefined;
    readonly isSetup: boolean;

    setup(): Promise<void>;
    updateState(state: T): Promise<T>;
}