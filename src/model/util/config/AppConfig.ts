import { ILogger } from "../../../interfaces/model/ILogger";
import { Dependency } from "../../../make";
import { inject, singleton } from "tsyringe";
import { CurrencyCode } from "../../../interfaces/model/currency/Currency";
import { EnvironmentFile, EnvironmentFileOptions } from "./EnvironmentFile";
import { BlockchainNetworkID, BlockchainPrivateKey } from "../../../interfaces/model/Contract";

export enum Stage {
    Local,
    Development,
    Production
}

export enum AppConfigError {
    InvalidStage
}

enum AppConfigKey {
    Stage = "STAGE",
    ApiVersion = "API_MAJOR_VERSION",
    Port = "PORT",
    
    BlockchainNetworkID = "BLOCKCHAIN_NETWORK_ID",
    BlockchainCurrency = "BLOCKCHAIN_CURRENCY",

    WalletBaseCurrency = "WALLET_BASE_CURRENCY",

    ContractCurrency = "CONTRACT_CURRENCY",
    // DeployerAddress = "DEPLOYER_ADDRESS",
    
    ExchangeRateUpdateInterval = "EXCHANGE_RATE_UPDATE_INTERVAL",
}

export type AppConfigOptions = EnvironmentFileOptions

@singleton()
export class AppConfig extends EnvironmentFile {

    // MARK: - Public Properties
    readonly stage: Stage;
    readonly version: string;
    readonly port: number;

    readonly blockchain: {
        readonly networkID: BlockchainNetworkID;
        readonly currency: CurrencyCode;
    }

    readonly wallet: {
        readonly baseCurrency: CurrencyCode;
    }

    readonly contract: {
        readonly currency: CurrencyCode;
        // readonly deployerAddress: BlockchainAddress;
    }

    readonly exchangeRate: {
        readonly updateInterval: number;
    }

    // MARK: - Initialization
    constructor(
        @inject(Dependency.AppConfigOptions) options: AppConfigOptions,
        @inject(Dependency.Logger) logger: ILogger
    ) {        
        super(options, "app", logger);

        this.stage = this.loadStage();
        this.version = this.loadRequiredValue(AppConfigKey.ApiVersion);
        this.port = parseInt(this.loadRequiredValue(AppConfigKey.Port));

        this.blockchain = {
            networkID: this.loadRequiredValue(AppConfigKey.BlockchainNetworkID),
            currency: this.loadRequiredValue(AppConfigKey.BlockchainCurrency)
        };

        this.wallet = {
            baseCurrency: this.loadRequiredValue(AppConfigKey.WalletBaseCurrency),
        };

        this.contract = {
            currency: this.loadRequiredValue(AppConfigKey.ContractCurrency),
            // deployerAddress: this.loadRequiredValue(AppConfigKey.DeployerAddress),
        };

        this.exchangeRate = {
            updateInterval: parseInt(this.loadRequiredValue(AppConfigKey.ExchangeRateUpdateInterval))
        };
    }

    // MARK: - Private Methods
    private loadStage(): Stage {
        const stage: Stage | undefined = Stage[this.loadRequiredValue(AppConfigKey.Stage) as keyof typeof Stage];

        if (stage == undefined) {
            throw AppConfigError.InvalidStage;
        }

        return stage;
    }

}