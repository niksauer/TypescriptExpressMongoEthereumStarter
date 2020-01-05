import { IStateStorage } from "../config/state/StateManager";
import fileSystem from "fs";
import { promisify } from "util";

const writeFileAsync = promisify(fileSystem.writeFile);
const readFileAsync = promisify(fileSystem.readFile);

export class JSONFileStorage<T> implements IStateStorage<T> {
    
    // MARK: - Private Properties
    private filePath: string;

    // MARK: - Initialization
    constructor(filePath: string) {
        this.filePath = filePath;
    }
    
    // MARK: - Public Methods
    async getState(): Promise<T> {
        const jsonString = await readFileAsync(this.filePath, "utf8");
        return JSON.parse(jsonString);
    }

    async updateState(state: T): Promise<void> {
        await writeFileAsync(this.filePath, JSON.stringify(state));
    }
    
}