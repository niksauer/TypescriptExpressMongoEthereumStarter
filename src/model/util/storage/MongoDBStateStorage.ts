import { IStateStorage } from "../config/state/StateManager";
import mongoose, { Schema, Document } from "mongoose";
import { assert, AssertError } from "../error/AssertError";

interface AnyDocument extends Document {
    id: string;
    any: any;
}

const AnySchema: Schema = new Schema({
    _id: {
        type: String,
        required: true
    },
    any: Schema.Types.Mixed
});

export const State = mongoose.model<AnyDocument>("State", AnySchema);

export class MongoDBStateStorage<T> implements IStateStorage<T> {
    
    // MARK: - Public Properties
    readonly name: string;

    // MARK: - Initialization
    constructor(name: string) {
        this.name = name;
    }

    // MARK: - Public Methods
    async getState(): Promise<T> {
        const states = await State.find({ _id: this.name });
        assert(states.length <= 1, AssertError.SingleAppStateExpected);
        
        if (states.length == 0) {
            return {} as T;
        } else {
            return (states[0]).any as T;
        }
    }

    async updateState(state: T): Promise<void> {
        const states = await State.find({ _id: this.name });
        assert(states.length <= 1, AssertError.SingleAppStateExpected);
        
        if (states.length == 0) {
            const storedState = new State({ 
                _id: this.name,
                any: state
            });
    
            await storedState.save();
        } else {
            const storedState = states[0];
            storedState.any = state;
            await storedState.save();
        }
    }

}