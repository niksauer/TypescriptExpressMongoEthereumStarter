export enum Dependency {
    // value types
    // -> config
    AppConfig = "appConfig",    
    SecretConfig = "secretConfig",
    ConnectionConfig = "connectionConfig",
    BoostrapConfig = "bootstrapConfig",
    TestConfig = "testConfig",

    AppConfigOptions = "appConfigOptions",
    SecretConfigOptions = "secretConfigOptions",
    ConnectionConfigOptions = "connectionConfigOptions",
    BootstrapConfigOptions = "bootstrapConfigOptions",
    TestConfigOptions = "testConfigOptions",

    // -> general
    Stage = "stage",
    
    DatabaseURI = "databaseURI",
    DatabaseName = "databaseName",
    DatabaseCollections = "databaseCollection",

    BlockchainNetworkID = "blockchainNetworkID",
    WalletBaseCurrency = "walletBaseCurrencyCode",
    
    ContractInfo = "contractInfo",    
    
    ExchangeRateUpdateInterval = "currencyUpdateInterval",

    EthereumServiceOptions = "ethereumServiceOptions",
    
    // -> app setup
    Endpoints = "endpoints",
    Middleware = "middleware",
    
    // reference types
    // -> interfaces
    // --> web services
    ContractService = "IContractService",
    BlockchainService = "BlockchainService",
    ExchangeService = "ExchangeService",
    
    // --> db services
    UUIDService = "IUUIDService",
    UserService = "IUserService",
    DriverService = "DriverService",
    TransactionService = "TransactionService",
    WalletService = "IWalletService",
    ExchangeRateService = "ExchangeRateService",
    
    // --> middleware
    DriverAuthMiddleware = "DriverAuthMiddleware",
    OptionalDriverAuthMiddleware = "OptionalDriverAuthMiddleware",
    
    // --> other
    Logger = "ILogger",
    Database = "IDatabase",
    CurrencyManager = "ICurrencyManager",
    Exchange = "IExchange",
    AppStateManager = "AppStateManager",
    
    // --> daemons
    ExchangeDaemon = "IExchangeDaemon",
}

import "reflect-metadata";
import { container } from "tsyringe";
import { CryptoCompareService } from "./model/services/web/CryptoCompareService";
import { ExchangeDaemon } from "./model/daemon/ExchangeDaemon";
import { AppConfig, Stage, AppConfigOptions } from "./model/util/config/AppConfig";
import { SecretConfig, SecretConfigOptions } from "./model/util/config/SecretConfig";
import { Backend, Endpoint } from "./app";
import { DriverController } from "./controller/DriverController";
import { DriverRouter } from "./router/DriverRouter";
import { UUIDService } from "./model/services/general/UUIDService";
import { BlockchainService } from "./interfaces/services/blockchain/BlockchainService";
import { EthereumService, EthereumServiceOptions } from "./model/services/blockchain/EthereumService";
import { ExchangeService } from "./interfaces/services/web/ExchangeService";
import { ethers } from "ethers";
import { UserService } from "./model/services/db/UserService";
import { WalletService } from "./model/services/db/WalletService";
import { TransactionService } from "./model/services/db/TransactionService";
import { OptionalAuth } from "./middleware/auth/OptionalAuth";
import { DriverAuth } from "./middleware/auth/DriverAuth";
import { ConsoleLogger } from "./model/util/logger/ConsoleLogger";
import { ILogger } from "./interfaces/model/ILogger";
import { Middleware } from "./interfaces/middleware/Middleware";
import { AuthMiddleware, AuthRegisterMiddleware } from "./interfaces/middleware/AuthMiddleware";
import { MongoDB } from "./model/database/MongoDB";
import { IContractService } from "./interfaces/contract/IContractService";
import { IDatabase, DATABASE_COLLECTIONS } from "./interfaces/database/IDatabase";
import { IUUIDService } from "./interfaces/services/general/IUUIDService";
import { IUserService, IDriverService } from "./interfaces/services/db/IUserService";
import { ITransactionService } from "./interfaces/services/db/ITransactionService";
import { IWalletService } from "./interfaces/services/db/IWalletService";
import { IExchangeDaemon, IExchange } from "./interfaces/model/daemon/IExchange";
import { ICurrencyManager } from "./interfaces/model/currency/ICurrencyManager";
import { CurrencyManager } from "./model/currency/CurrencyManager";
import { IExchangeRateService } from "./interfaces/services/db/IExchangeRateService";
import { ExchangeRateService } from "./model/services/db/ExchangeRateService";
import { ContractInfo, BlockchainNetworkID } from "./interfaces/model/Contract";
import { ConnectionConfig, ConnectionConfigOptions } from "./model/util/config/ConnectionConfig";
import { BootstrapConfigOptions, BootstrapConfig } from "./model/util/config/BootstrapConfig";
import { TestConfig, TestConfigOptions } from "./model/util/config/TestConfig";
import { IStateManager } from "./interfaces/model/IStateManager";
import { IStateStorage, StateManager } from "./model/util/config/state/StateManager";
import { AppState } from "./model/util/config/state/AppState";
import { CurrencyCode } from "./interfaces/model/currency/Currency";

export type AppConfigOptionsGenerator = () => Promise<AppConfigOptions>;
export type SecretConfigOptionsGenerator = () => Promise<AppConfigOptions>;
export type ConnectionConfigOptionsGenerator = (appConfig: AppConfig, secretConfig: SecretConfig, testConfig?: TestConfig) => Promise<ConnectionConfigOptions>;
export type BootstrapConfigOptionsGenerator = (testConfig?: TestConfig) => Promise<BootstrapConfigOptions>;
export type TestConfigOptionsGenerator = () => Promise<TestConfigOptions>;

export interface DependencyContainerOptions {
    appConfig: AppConfigOptionsGenerator;
    secretConfig: SecretConfigOptionsGenerator;
    connectionConfig: ConnectionConfigOptionsGenerator;
    bootstrapConfig: BootstrapConfigOptionsGenerator;
    testConfig?: TestConfigOptionsGenerator;
    appStateStorage: IStateStorage<AppState>;
}

export class DependencyContainer {

    // MARK: - Public Properties
    static shared = new DependencyContainer();

    // MARK: - Private Properties
    private logger?: ILogger;

    // MARK: - Initialization
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    // MARK: - Public Methods
    async setup(options: DependencyContainerOptions): Promise<void> {        
        this.registerLogger();
        this.logger = this.makeLogger();

        const appStateManager = new StateManager<AppState>(options.appStateStorage, this.logger);
        container.register<IStateManager<AppState>>(Dependency.AppStateManager, { useValue: appStateManager });

        const appConfigOptions = await options.appConfig();
        const appConfig = this.registerAppConfig(appConfigOptions);

        const secretConfigOptions = await options.secretConfig();
        const secretConfig = this.registerSecretConfig(secretConfigOptions);

        let testConfig: TestConfig | undefined;

        if (options.testConfig != undefined) {            
            const testConfigOptions = await options.testConfig();
            testConfig = this.registerTestConfig(testConfigOptions);
        }

        this.registerDefaults();
        
        const connectionConfigOptions = await options.connectionConfig(appConfig, secretConfig, testConfig);
        this.registerConnectionConfig(connectionConfigOptions);

        const bootstrapConfigOptions = await options.bootstrapConfig(testConfig);
        this.registerBootstrapConfig(bootstrapConfigOptions);
    
        this.registerEndpoints();
        this.registerApp();
    }

    makeLogger(): ILogger {
        return container.resolve<ILogger>(Dependency.Logger);
    }
    
    makeAppConfig(): AppConfig {
        return container.resolve<AppConfig>(Dependency.AppConfig);
    }

    makeSecretConfig(): SecretConfig {
        return container.resolve<SecretConfig>(Dependency.SecretConfig);
    }
    
    makeConnectionConfig(): ConnectionConfig {
        return container.resolve<ConnectionConfig>(Dependency.ConnectionConfig);
    }

    makeBootstrapConfig(): BootstrapConfig {
        return container.resolve<BootstrapConfig>(Dependency.BoostrapConfig);
    }

    makeTestConfig(): TestConfig {
        return container.resolve<TestConfig>(Dependency.TestConfig);
    }

    makeApp(): Backend {    
        return container.resolve(Backend);
    }

    makeDatabase(): IDatabase {
        return container.resolve<IDatabase>(Dependency.Database);
    }
    
    makeContractInfo(): ContractInfo {
        const appConfig = this.makeAppConfig();
        const connectionConfig = this.makeConnectionConfig();
        
        return {
            currency: appConfig.contract.currency,
            address: connectionConfig.contract.address,
            networkID: appConfig.blockchain.networkID
        };
    }

    makeContractService(): IContractService {
        return container.resolve<IContractService>(Dependency.ContractService);
    }

    makeWalletService(): WalletService {
        return container.resolve<WalletService>(Dependency.WalletService);
    }

    makeAppStateManager(): IStateManager<AppState> {
        return container.resolve<IStateManager<AppState>>(Dependency.AppStateManager);
    }

    // MARK: - Private Methods
    private registerLogger() {
        // -> default logger with stage = Local
        container.register<Stage>(Dependency.Stage, { useValue: Stage.Local });
        container.registerSingleton<ConsoleLogger>(Dependency.Logger, ConsoleLogger);    
    }
    
    private registerAppConfig(options: AppConfigOptions): AppConfig {
        container.register<AppConfigOptions>(Dependency.AppConfigOptions, { useValue: options });    
        container.registerSingleton<AppConfig>(Dependency.AppConfig, AppConfig);
        const appConfig = container.resolve<AppConfig>(Dependency.AppConfig);
        this.logger?.debug("Registered app config:");
        this.logger?.debug(appConfig as any);
    
        // app config dependent registrations
        
        // -> update logger with config's stage (work because reference type)
        const logger = container.resolve<ILogger>(Dependency.Logger);
        logger.stage = appConfig.stage;
    
        // -> value types
        container.register<Stage>(Dependency.Stage, { useValue: appConfig.stage });
        
        container.register<BlockchainNetworkID>(Dependency.BlockchainNetworkID, { useValue: appConfig.blockchain.networkID });
    
        container.register<CurrencyCode>(Dependency.WalletBaseCurrency, { useValue: appConfig.wallet.baseCurrency });
    
        container.register<number>(Dependency.ExchangeRateUpdateInterval, { useValue: appConfig.exchangeRate.updateInterval });

        return appConfig;
    }

    private registerSecretConfig(options: SecretConfigOptions): SecretConfig {
        container.register<SecretConfigOptions>(Dependency.SecretConfigOptions, { useValue: options });    
        container.registerSingleton<SecretConfig>(Dependency.SecretConfig, SecretConfig);
        const secretConfig = container.resolve<SecretConfig>(Dependency.SecretConfig);
        this.logger?.debug("Registered secret config:");
        this.logger?.debug(secretConfig as any);
        return secretConfig;
    }

    private registerTestConfig(options: TestConfigOptions): TestConfig {
        container.register<TestConfigOptions>(Dependency.TestConfigOptions, { useValue: options });    
        container.registerSingleton<TestConfig>(Dependency.TestConfig, TestConfig);
        const testConfig = container.resolve<TestConfig>(Dependency.TestConfig);
        this.logger?.debug("Registered test config:");
        this.logger?.debug(testConfig as any);
        return testConfig;
    }
    
    private registerDefaults() {
        // interfaces
        // -> services
        container.register<IUUIDService>(Dependency.UUIDService, UUIDService);
        container.register<ExchangeService>(Dependency.ExchangeService, CryptoCompareService);
    
        container.register<IUserService>(Dependency.UserService, UserService);
        container.register<IDriverService>(Dependency.DriverService, UserService);
        container.register<ITransactionService>(Dependency.TransactionService, TransactionService);
        container.register<IWalletService>(Dependency.WalletService, WalletService);
        container.register<IExchangeRateService>(Dependency.ExchangeRateService, ExchangeRateService);
    
        // -> auth middleware
        container.registerSingleton<AuthRegisterMiddleware>(Dependency.DriverAuthMiddleware, DriverAuth);
    
        const optionalDriverAuthMiddleware = new OptionalAuth([container.resolve(Dependency.DriverAuthMiddleware)]);
        container.register<AuthMiddleware>(Dependency.OptionalDriverAuthMiddleware, { useValue: optionalDriverAuthMiddleware });
    
        // -> database
        container.register<string[]>(Dependency.DatabaseCollections, { useValue: DATABASE_COLLECTIONS });
        container.register<IDatabase>(Dependency.Database, MongoDB);
    
        // -> other
        container.register<ICurrencyManager>(Dependency.CurrencyManager, CurrencyManager);
    
        // -> daemons
        container.registerSingleton<IExchangeDaemon>(Dependency.ExchangeDaemon, ExchangeDaemon);
    
        container.register<IExchange>(Dependency.Exchange, { useValue: container.resolve(Dependency.ExchangeDaemon) });
    
        // concretes
        // -> controller & router
        container.register<DriverController>(DriverController, DriverController);
        container.register<DriverRouter>(DriverRouter, DriverRouter);
    }
    
    private registerConnectionConfig(options: ConnectionConfigOptions): ConnectionConfig {    
        const appConfig = container.resolve<AppConfig>(Dependency.AppConfig);
        const secretConfig = container.resolve<SecretConfig>(Dependency.SecretConfig);
    
        container.register<ConnectionConfigOptions>(Dependency.ConnectionConfigOptions, { useValue: options });    
        container.registerSingleton<ConnectionConfig>(Dependency.ConnectionConfig, ConnectionConfig);
    
        const connectionConfig = container.resolve<ConnectionConfig>(Dependency.ConnectionConfig);
        this.logger?.debug("Registered connection config:");
        this.logger?.debug(connectionConfig as any);
    
        // connection config dependent registrations
    
        const blockchainUriOrProvider = connectionConfig.blockchain.uriOrProvider;
        const contractAddress = connectionConfig.contract.address;
    
        container.register<string>(Dependency.DatabaseURI, { useValue: connectionConfig.database.uri });
        container.register<string>(Dependency.DatabaseName, { useValue: connectionConfig.database.name });
    
        switch (appConfig.blockchain.currency) {
        case "ETH":
            container.register<EthereumServiceOptions>(Dependency.EthereumServiceOptions, { useValue: {
                uriOrProvider: blockchainUriOrProvider
            } as EthereumServiceOptions });

            container.register<BlockchainService>(Dependency.BlockchainService, EthereumService);
    
            break;
        default:
            break;
        }
    
        container.register<ContractInfo>(Dependency.ContractInfo, { useValue: {
            address: contractAddress,
            networkID: appConfig.blockchain.networkID,
            currency: appConfig.contract.currency
        }});
    
        let blockchainProvider: ethers.providers.Provider;
    
        if (typeof blockchainUriOrProvider == "string") {
            blockchainProvider = new ethers.providers.JsonRpcProvider(blockchainUriOrProvider);
        } else {    
            blockchainProvider = blockchainUriOrProvider;
        }
    
        const deployerWallet = new ethers.Wallet(secretConfig.contract.deployerPrivateKey, blockchainProvider);
        // const contractService = new ContractService(contractAddress, deployerWallet);
        // container.register<IContractService>(Dependency.ContractService, { useValue: contractService });

        return connectionConfig;
    }
    
    private registerBootstrapConfig(options: BootstrapConfigOptions) {
        container.register<BootstrapConfigOptions>(Dependency.BootstrapConfigOptions, { useValue: options });    
        container.registerSingleton<BootstrapConfig>(Dependency.BoostrapConfig, BootstrapConfig);
    
        const bootstrapConfig = container.resolve<BootstrapConfig>(Dependency.BoostrapConfig);
        this.logger?.debug("Registered bootstrap config:");
        this.logger?.debug(bootstrapConfig as any);
    }
    
    private registerEndpoints() {    
        const middleware: Middleware[] = [
            container.resolve(Dependency.DriverAuthMiddleware),
            container.resolve(Dependency.OptionalDriverAuthMiddleware),
        ];
        
        container.register<Middleware[]>(Dependency.Middleware, { useValue: middleware });
    
        const endpoints: Endpoint[] = [
            { path: "driver", router: container.resolve(DriverRouter) },
        ];
        
        container.register<Endpoint[]>(Dependency.Endpoints, { useValue: endpoints });
    }
    
    private registerApp() {
        container.register<Backend>(Backend, Backend);
    }

}