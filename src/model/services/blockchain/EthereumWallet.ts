import { ethers } from "ethers";
import { BlockchainPrivateKey } from "../../../interfaces/model/Contract";
import { BigNumber } from "ethers/utils";
import { BlockchainWallet } from "../../../interfaces/services/blockchain/BlockchainWallet";
import { EthereumTransaction } from "./EthereumService";

export class EthereumWallet implements BlockchainWallet {
    
    // MARK: - Private Properties
    private ethersWallet: ethers.Wallet;

    // MARK: - Public Properties
    get address(): string {
        return this.ethersWallet.address;
    }

    // MARK: - Initialization
    constructor(privateKey?: BlockchainPrivateKey) {
        if (privateKey) {
            this.ethersWallet = new ethers.Wallet(privateKey);
        } else {
            this.ethersWallet = ethers.Wallet.createRandom();
        }
    }

    // MARK: - Public Methods
    encrypt(password: string): Promise<string> {
        return this.ethersWallet.encrypt(password);
    }

    async signTransaction(transaction: EthereumTransaction): Promise<string> {
        return this.ethersWallet.sign({ 
            to: transaction.to, 
            value: new BigNumber(transaction.value.toString()),
            gasLimit: new BigNumber(transaction.gasLimit.toString()),
            gasPrice: new BigNumber(transaction.gasPrice.toString()),
            nonce: transaction.nonce,
            chainId: transaction.chainID
        });
    }

}

