import { singleton, inject } from "tsyringe";
import { EnvironmentFile, parseBoolean, EnvironmentFileOptions, parseOptionalBoolean } from "./EnvironmentFile";
import { Dependency } from "../../../make";
import { ILogger } from "../../../interfaces/model/ILogger";

enum BootstrapConfigKey {    
    ResetDatabase = "RESET_DB",
    
    BootstrapAllEntities = "BOOTSTRAP_ALL_ENTITIES",
    BootstrapDrivers = "BOOTSTRAP_DRIVER_DB",
    BootstrapDriverWallets = "BOOTSTRAP_DRIVER_WALLET_DB",
    BootstrapTransactions = "BOOTSTRAP_TRANSACTION_DB",
    
    FundDriverWallets = "FUND_DRIVER_WALLETS",
}

export interface BootstrapOptions {
    database?: BootstrapConfig["database"];
    blockchain?: BootstrapConfig["blockchain"];
}

export type BootstrapConfigOptions = EnvironmentFileOptions & BootstrapOptions;

@singleton()
export class BootstrapConfig extends EnvironmentFile {
    
    // MARK: - Public Properties
    readonly database: {
        readonly reset: boolean;
        readonly entities: {
            readonly all: boolean;
            readonly driver?: boolean;
            readonly driverWallets?: boolean;
            readonly transactions?: boolean;
        };
    }

    readonly blockchain: {
        readonly funding: {
            readonly drivers: boolean;
        };
    }
    
    // MARK: - Initialization
    constructor(
        @inject(Dependency.BootstrapConfigOptions) options: BootstrapConfigOptions,
        @inject(Dependency.Logger) logger: ILogger,
    ) {        
        super(options, "bootstrap", logger);

        this.database = {
            reset: options.database?.reset ?? parseBoolean(this.loadRequiredValue(BootstrapConfigKey.ResetDatabase)),
            entities: {
                all: options.database?.entities?.all ?? parseBoolean(this.loadRequiredValue(BootstrapConfigKey.BootstrapAllEntities)),
                driver: options.database?.entities.driver ?? parseOptionalBoolean(this.loadValue(BootstrapConfigKey.BootstrapDrivers, true)),
                driverWallets: options.database?.entities.driver ?? parseOptionalBoolean(this.loadValue(BootstrapConfigKey.BootstrapDriverWallets, true)),
                transactions: options.database?.entities.driver ?? parseOptionalBoolean(this.loadValue(BootstrapConfigKey.BootstrapTransactions, true)),
            }
        };

        this.blockchain = {
            funding: {
                drivers: options.blockchain?.funding.drivers ?? parseBoolean(this.loadRequiredValue(BootstrapConfigKey.FundDriverWallets))
            }
        };
    }
    
}