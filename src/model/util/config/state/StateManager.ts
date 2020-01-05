import { assert, AssertError } from "../../error/AssertError";
import { IStateManager } from "../../../../interfaces/model/IStateManager";
import { ILogger } from "../../../../interfaces/model/ILogger";

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IStateStorage<T> {
    getState(): Promise<T>;
    updateState(state: T): Promise<void>;
}

export class StateManager<T> implements IStateManager<T> {

    // MARK: - Public Properties
    get state(): T | undefined {
        assert(this.isSetup, AssertError.AppStateManagerSetupExpected);
        return this._state;
    }

    get isSetup(): boolean {
        return this._isSetup;
    }

    // MARK: - Private Properties
    private storage: IStateStorage<T>;
    private logger: ILogger;

    private _state: T | undefined;
    private _isSetup = false;

    // MARK: - Initialization
    constructor(storage: IStateStorage<T>, logger: ILogger) {
        this.storage = storage;
        this.logger = logger;
    }

    // MARK: - Public Methods
    async setup(): Promise<void> {
        this._state = await this.loadState();
        this._isSetup = true;
    }
    
    async updateState(state: T): Promise<T> {
        await this.storage.updateState(state);
        this._state = state;
        this.logger.debug("Updated state to:");
        this.logger.debug(state as any);
        return state;
    } 

    // MARK: - Private Methods
    private async loadState(): Promise<T> {
        const state = await this.storage.getState();
        this.logger.debug("Loaded state:");
        this.logger.debug(state as any);
        return state;
    }

}