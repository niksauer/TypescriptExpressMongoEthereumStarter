import { singleton, inject } from "tsyringe";
import { ethers } from "ethers";
import { ILogger } from "../../../interfaces/model/ILogger";
import { Dependency } from "../../../make";
import { EnvironmentFile, EnvironmentFileOptions } from "./EnvironmentFile";

enum ConnectionConfigKey {    
    DatabaseProtocol = "DATABASE_PROTOCOL",
    DatabaseHost = "DATABASE_HOST",
    DatabasePort = "DATABASE_PORT",
    DatabaseName = "DATABASE_NAME",

    BlockchainProtocol = "BLOCKCHAIN_PROTOCOL",
    BlockchainHost = "BLOCKCHAIN_HOST",
    BlockchainPort = "BLOCKCHAIN_PORT",

    ContractAddress = "CONTRACT_ADDRESS",
}

export interface ConnectionConfigOptions extends EnvironmentFileOptions {
    database?: ConnectionConfig["database"];
    blockchain?: ConnectionConfig["blockchain"];
    contract?: ConnectionConfig["contract"];
}

@singleton()
export class ConnectionConfig extends EnvironmentFile {
    
    // MARK: - Public Properties
    readonly database: {
        readonly uri: string;
        readonly name: string;
    }

    readonly blockchain: {
        readonly uriOrProvider: string | ethers.providers.Provider;
    }
    
    readonly contract: {
        readonly address: string;
    }

    // MARK: - Initialization
    constructor(
        @inject(Dependency.ConnectionConfigOptions) options: ConnectionConfigOptions,
        @inject(Dependency.Logger) logger: ILogger,
    ) {        
        super(options, "connection", logger);

        this.database = {
            uri: options.database?.uri ?? this.getURI(ConnectionConfigKey.DatabaseProtocol, ConnectionConfigKey.DatabaseHost, ConnectionConfigKey.DatabasePort),
            name: options.database?.name ?? this.loadRequiredValue(ConnectionConfigKey.DatabaseName),
        };

        this.blockchain = {
            uriOrProvider: options.blockchain?.uriOrProvider ?? this.getURI(ConnectionConfigKey.BlockchainProtocol, ConnectionConfigKey.BlockchainHost, ConnectionConfigKey.BlockchainPort),
        };

        this.contract = {
            address: options.contract?.address ?? this.loadRequiredValue(ConnectionConfigKey.ContractAddress),
        };
    }

    // MARK: - Initialization
    private getURI(protocolKey: ConnectionConfigKey, hostKey: ConnectionConfigKey, portKey: ConnectionConfigKey) {
        const protocol = this.loadRequiredValue(protocolKey);
        const host = this.loadRequiredValue(hostKey);
        const port = this.loadRequiredValue(portKey);

        return `${protocol}://${host}:${port}`;
    }

}