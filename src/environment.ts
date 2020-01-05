import { createDemoDrivers, createDemoTransactions } from "./model/database/bootstrap";
import { ethers } from "ethers";
import { AppConfig } from "./model/util/config/AppConfig";
import { ConnectionConfig } from "./model/util/config/ConnectionConfig";
import { ILogger } from "./interfaces/model/ILogger";
import { BootstrapConfig } from "./model/util/config/BootstrapConfig";
import { IDatabase } from "./interfaces/database/IDatabase";
import { ContractInfo, BlockchainAddress } from "./interfaces/model/Contract";
import { DependencyContainer } from "./make";
import { WalletService } from "./model/services/db/WalletService";
import { CreateOrUpdateWalletRequest } from "./interfaces/request/driver/CreateOrUpdateWalletRequest";
import { DriverDocument } from "./model/database/User";
import { WalletDocument } from "./model/database/Wallet";
import { IStateManager } from "./interfaces/model/IStateManager";
import { AppState } from "./model/util/config/state/AppState";
import { SecretConfig } from "./model/util/config/SecretConfig";

interface BootstrapDatabaseArguments {
    bootstrapConfig: BootstrapConfig["database"];
    database: IDatabase;
    contractInfo: ContractInfo;
    walletService: WalletService;
    appStateManager: IStateManager<AppState>;
    logger: ILogger;
}

interface BootstrapDatabaseResponse {
    drivers?: DriverDocument[];
    driverWallets?: { driverID: string; wallet: WalletDocument }[];
}

async function bootstrapDatabase(args: BootstrapDatabaseArguments, isAutomatedTest: boolean): Promise<BootstrapDatabaseResponse> {    
    const bootstrap = args.bootstrapConfig;
    const logger = args.logger;
    const walletService = args.walletService;
    const appStateManager = args.appStateManager;
    let appState = appStateManager.state || {};
    const contractInfo = args.contractInfo;
    const database = args.database;

    if (bootstrap.reset) {
        if (isAutomatedTest) {
            await database.dropDatabase();
        } else {
            await database.dropCollections();
        }

        appState = await appStateManager.updateState({});
        logger.debug("Reset database");
    }

    const errors: any[] = [];

    let drivers: BootstrapDatabaseResponse["drivers"];
    let driverWallets: BootstrapDatabaseResponse["driverWallets"];

    if (bootstrap.entities.all || bootstrap.entities.driver) {
        try {
            drivers = await createDemoDrivers();
            logger.debug("Bootstrapped driver");

            if (bootstrap.entities.all || bootstrap.entities.driverWallets) {
                try {
                    driverWallets = await Promise.all(drivers.map(async driver => {
                        const quoteCurrency = "EUR";
                        const password = "hello";
    
                        const createWalletRequest: CreateOrUpdateWalletRequest = {
                            quoteCurrency: quoteCurrency,
                            password: password
                        };
                
                        return {
                            driverID: driver.id,
                            wallet: (await walletService.createOrUpdateWallet(createWalletRequest, driver)).wallet
                        };
                    }));

                    logger.debug("Bootstrapped driver wallets");

                    if (driverWallets != undefined && (bootstrap.entities.all || bootstrap.entities.transactions)) {
                        try {
                            const addressForDriverID = driverWallets.reduce((result: any, driverWallet) => {
                                result[driverWallet.driverID] = driverWallet.wallet.address;
                                return result;
                            }, {});
                            
                            await createDemoTransactions(contractInfo, addressForDriverID);
                            logger.debug("Bootstrapped transactions");
                        } catch (error) {
                            logger.error("Failed to bootstrap transactions:");
                            logger.error(error);
                            errors.push(error);
                        }
                    }
                } catch (error) {
                    logger.error("Failed to bootstrap wallets:");
                    logger.error(error);
                    errors.push(error);
                }
            }
        } catch (error) {
            logger.error("Failed to bootstrap drivers:");
            logger.error(error);
            errors.push(error);
        }
    }

    if (errors.length > 0) {
        throw errors;
    }

    return {
        drivers,
        driverWallets
    };
}

interface BoostrapBlockchainArguments {
    bootstrapConfig: BootstrapConfig["blockchain"];
    appConfig: AppConfig;
    secretConfig: SecretConfig;
    connectionConfig: ConnectionConfig;
    blockchainProvider: ethers.providers.Provider;
    logger: ILogger;
    funding: {
        addresses: BlockchainAddress[];
        amount: number;
    };
    appStateManager: IStateManager<AppState>;
}

async function bootstrapBlockchain(args: BoostrapBlockchainArguments) {
    const bootstrap = args.bootstrapConfig;
    const appConfig = args.appConfig;
    const secretConfig = args.secretConfig;
    const connectionConfig = args.connectionConfig;
    const blockchainProvider = args.blockchainProvider;
    const logger = args.logger;
    const appStateManager = args.appStateManager;

    const deployerWallet = new ethers.Wallet(secretConfig.contract.deployerPrivateKey, blockchainProvider);

    const errors: any[] = [];
    
    for (const address of args.funding.addresses) {
        const addressFundingAmount = args.funding.amount;

        try {
            await deployerWallet.sendTransaction({
                to: address,
                value: ethers.utils.parseEther(`${addressFundingAmount}`)
            });

            logger.debug(`Funded address '${address}' with ${addressFundingAmount} ether`);
            
            const addressBalance = await blockchainProvider.getBalance(address);
            logger.debug(`Address '${address}' now has ${ethers.utils.formatEther(addressBalance)} ether`);
        } catch (error) {
            logger.error(`Failed to fund address '${address}'`);
            logger.error(error);
            errors.push(error);
        }
    }  
    
    if (errors.length > 0) {
        throw errors;
    }
}

export async function prepareEnvironment(dependencyContainer: DependencyContainer, logger: ILogger, isAutomatedTest: boolean) {
    logger.debug("Preparing environment...");

    const appConfig = dependencyContainer.makeAppConfig();
    const secretConfig = dependencyContainer.makeSecretConfig();
    const connectionConfig = dependencyContainer.makeConnectionConfig();
    const bootstrapConfig = dependencyContainer.makeBootstrapConfig();
    const contractInfo = dependencyContainer.makeContractInfo();
    const walletService = dependencyContainer.makeWalletService();
    
    const database = dependencyContainer.makeDatabase();
    await database.connect();

    const appStateManager = dependencyContainer.makeAppStateManager();
    await appStateManager.setup();

    let blockchainProvider: ethers.providers.Provider;

    if (typeof connectionConfig.blockchain.uriOrProvider == "string") {
        blockchainProvider = new ethers.providers.JsonRpcProvider(connectionConfig.blockchain.uriOrProvider);
    } else {
        blockchainProvider = connectionConfig.blockchain.uriOrProvider;
    }

    // const deployerContractService = dependencyContainer.makeContractService();

    const bootstrapDatabaseResponse = await bootstrapDatabase({
        bootstrapConfig: bootstrapConfig.database,
        database: database,
        contractInfo: contractInfo,
        logger: logger,
        walletService: walletService,
        appStateManager: appStateManager,
    }, isAutomatedTest);

    const driverAddresses = bootstrapDatabaseResponse.driverWallets?.map(walletAssignment => walletAssignment.wallet.address);

    await bootstrapBlockchain({
        blockchainProvider: blockchainProvider,
        appConfig: appConfig,
        secretConfig: secretConfig,
        connectionConfig: connectionConfig,
        logger: logger,
        bootstrapConfig: bootstrapConfig.blockchain,
        funding: {
            addresses: bootstrapConfig.blockchain.funding.drivers == true ? driverAddresses ?? [] : [],
            amount: 1
        },
        appStateManager: appStateManager,
    });

    logger.debug("Finished environment setup");
}