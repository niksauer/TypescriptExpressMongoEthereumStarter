import { Application } from "express";
import Ganache from "ganache-core";
import { CurrencyManager } from "../../src/model/currency/CurrencyManager";
import { Backend } from "../../src/app";
import { ethers } from "ethers";
import { AppConfig } from "../../src/model/util/config/AppConfig";
import { JSONFileStorage } from "../../src/model/util/storage/JSONFileStorage";
import { BootstrapOptions } from "../../src/model/util/config/BootstrapConfig";
import { DependencyContainer } from "../../src/make";
import { prepareEnvironment } from "../../src/environment";
import { TestConfig } from "../../src/model/util/config/TestConfig";
import { assert, AssertError } from "../../src/model/util/error/AssertError";
import { BlockchainPrivateKey } from "../../src/interfaces/model/Contract";
import { Currency } from "../../src/interfaces/model/currency/Currency";
import { SecretConfig } from "../../src/model/util/config/SecretConfig";

export enum TestError {
    TestConfigRequired    
}

export interface Environment {
    appConfig: AppConfig;
    app: Backend;
    expressApp: Application;
    blockchainCurrency: Currency;
}

export async function deployContract(blockchainProvider: ethers.providers.Provider, deployerPrivateKey: BlockchainPrivateKey): Promise<string> {
    let contractABI: any;
    let contractBytecode: any;
    
    // https://docs.ethers.io/ethers.js/html/api-contract.html
    const deployerWallet = new ethers.Wallet(deployerPrivateKey, blockchainProvider);
    const contractFactory = new ethers.ContractFactory(contractABI, contractBytecode, deployerWallet);

    // Notice we pass in "Hello World" as the parameter to the constructor
    const contract = await contractFactory.deploy();

    // The address the Contract WILL have once mined
    // console.log(contract.address);

    // The transaction that was sent to the network to deploy the Contract
    // console.log(contract.deployTransaction.hash);
    // "0x159b76843662a15bd67e482dcfbee55e8e44efad26c5a614245e12a00d4b1a51"

    // The contract is NOT deployed yet; we must wait until it is mined
    await contract.deployed();

    return contract.address;
}

export async function setupTestEnvironment(options: BootstrapOptions): Promise<Environment> {        
    const dependencyContainer = DependencyContainer.shared;
    
    await dependencyContainer.setup({
        appConfig: async () => {
            return {
                fileName: "config/app.env"
            };
        },
        secretConfig: async () => {
            return {
                fileName: "config/secret.env"
            };
        },
        connectionConfig: async (appConfig: AppConfig, secretConfig: SecretConfig, testConfig: TestConfig | undefined) => {        
            assert(testConfig != undefined, AssertError.TestConfigExpected);
            
            if (!testConfig) {
                throw TestError.TestConfigRequired;
            }

            const fileName = "config/test/connection.env";
    
            if (!testConfig.inMemory) {
                console.log("Preparing external test enviroment.");
    
                return {
                    fileName: fileName,
                };
            }
    
            console.log("Preparing in-memory test enviroment.");
            
            const inMemoryMongoDbUrl = process.env.MONGO_URL;
            assert(inMemoryMongoDbUrl != undefined, AssertError.InMemoryMongoDbUrlExpected);

            const databaseURIParts = inMemoryMongoDbUrl.split("/");
            const databaseName = databaseURIParts.pop()!;    
            const databaseURI = databaseURIParts.join("/");
    
            const blockchainProvider = new ethers.providers.Web3Provider(Ganache.provider({
                mnemonic: secretConfig.blockchain.mnemonic,
                // eslint-disable-next-line @typescript-eslint/camelcase
                total_accounts: 10,
                // eslint-disable-next-line @typescript-eslint/camelcase
                default_balance_ether: 100,
            }) as any);
            
            const contractAddress = await deployContract(blockchainProvider, secretConfig.contract.deployerPrivateKey);
    
            return {
                fileName: fileName,
                database: {
                    uri: databaseURI,
                    name: databaseName,
                },
                blockchain: {
                    uriOrProvider: blockchainProvider,
                },
                contract: {
                    address: contractAddress
                }
            };
        },
        bootstrapConfig: async () => {
            return {
                fileName: "config/test/bootstrap.env",
                database: options.database,
                blockchain: options.blockchain
            };
        },
        testConfig: async() => {
            return {
                fileName: "config/test.env"
            };
        },
        appStateStorage: new JSONFileStorage("config/test/state.json")
    });

    const logger = dependencyContainer.makeLogger();
    
    await prepareEnvironment(dependencyContainer, logger, true);

    const config = dependencyContainer.makeAppConfig();
    const app = dependencyContainer.makeApp();
    
    const blockchainCurrency = new CurrencyManager().getCurrency(config.blockchain.currency);
    assert(blockchainCurrency != undefined, AssertError.CurrencyExpected);

    const expressApp = await app.setup();

    return {
        appConfig: config,
        app: app,
        expressApp: expressApp,
        blockchainCurrency: blockchainCurrency,
    };
}

