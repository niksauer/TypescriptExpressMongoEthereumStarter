import { ILogger } from "../../../interfaces/model/ILogger";
import { Dependency } from "../../../make";
import { inject, singleton } from "tsyringe";
import { EnvironmentFile, EnvironmentFileOptions } from "./EnvironmentFile";
import { BlockchainPrivateKey } from "../../../interfaces/model/Contract";

enum SecretConfigKey {
    BlockchainMnemonic = "BLOCKCHAIN_MNEMONIC",

    DeployerPrivateKey = "DEPLOYER_PRIVATE_KEY",
}

export type SecretConfigOptions = EnvironmentFileOptions

@singleton()
export class SecretConfig extends EnvironmentFile {

    // MARK: - Public Properties
    readonly blockchain: {
        readonly mnemonic: string;
    }

    readonly contract: {
        readonly deployerPrivateKey: BlockchainPrivateKey;
    }

    // MARK: - Initialization
    constructor(
        @inject(Dependency.SecretConfigOptions) options: SecretConfigOptions,
        @inject(Dependency.Logger) logger: ILogger
    ) {        
        super(options, "secret", logger);

        this.blockchain = {
            mnemonic: this.loadRequiredValue(SecretConfigKey.BlockchainMnemonic),
        };

        this.contract = {
            deployerPrivateKey: this.loadRequiredValue(SecretConfigKey.DeployerPrivateKey),
        };
    }

}