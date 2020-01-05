import { ILogger } from "../../../interfaces/model/ILogger";
import { Dependency } from "../../../make";
import { inject, singleton } from "tsyringe";
import { EnvironmentFile, parseBoolean, EnvironmentFileOptions } from "./EnvironmentFile";

enum TestConfigKey {
    InMemoryTest = "IN_MEMORY",
}

export type TestConfigOptions = EnvironmentFileOptions

@singleton()
export class TestConfig extends EnvironmentFile {

    // MARK: - Public Properties
    readonly inMemory: boolean;

    // MARK: - Initialization
    constructor(
        @inject(Dependency.TestConfigOptions) options: TestConfigOptions,
        @inject(Dependency.Logger) logger: ILogger
    ) {        
        super(options, "test", logger);

        this.inMemory = parseBoolean(this.loadRequiredValue(TestConfigKey.InMemoryTest));
    }

}