import { ethers, Contract } from "ethers";
import { getAddress, parseUnits } from "ethers/utils";
import { Provider } from "ethers/providers";
import { BlockchainService, BlockchainTransaction, BlockchainTransactionRequest } from "../../../interfaces/services/blockchain/BlockchainService";
import { EthereumWallet } from "./EthereumWallet";
import { injectable, inject } from "tsyringe";
import { Dependency } from "../../../make";
import Big from "big.js";
import { BlockchainNetworkID, BlockchainAddress } from "../../../interfaces/model/Contract";
import { Error, ErrorReason } from "../../util/error/Error";
import { Ether, EthereumCurrency } from "../../currency/crypto/Ether";
import { ERC20Token } from "../../currency/crypto/ERC20Token";

export interface EthereumTransaction extends BlockchainTransaction {
    gasLimit: Big;
    gasPrice: Big;
    nonce: number;
    chainID: number;
}

export interface EthereumServiceOptions {
    uriOrProvider: string | ethers.providers.Provider;
}

@injectable()
export class EthereumService implements BlockchainService {
    
    // MARK: - Public Properties
    readonly networkID: BlockchainNetworkID;

    readonly standardGasLimit = new Big(21000);
    
    // MARK: - Private Properties
    private readonly nativeCurrency = new Ether();
    private readonly blockchainProvider: Provider;

    // MARK: - Initialization
    constructor(
        @inject(Dependency.BlockchainNetworkID) networkID: BlockchainNetworkID,
        @inject(Dependency.EthereumServiceOptions) options: EthereumServiceOptions,
    ) {
        if (typeof options.uriOrProvider == "string") {
            this.blockchainProvider = new ethers.providers.JsonRpcProvider(options.uriOrProvider);
        } else {
            this.blockchainProvider = options.uriOrProvider;
        }

        this.networkID = networkID;
    }

    // MARK: - Public Methods
    // MARK: Wallet
    createWallet(): EthereumWallet {
        return new EthereumWallet();
    }

    async unlockWallet(encryptedWallet: string, password: string): Promise<EthereumWallet> {
        const ethersWallet = await ethers.Wallet.fromEncryptedJson(encryptedWallet, password);
        return new EthereumWallet(ethersWallet.privateKey);
    }

    async getBaseUnitBalance(address: string, currency: EthereumCurrency): Promise<Big> {
        if (currency instanceof Ether) {
            return new Big((await this.blockchainProvider.getBalance(address)).toString());
        } else if (currency instanceof ERC20Token) {
            const minumumERC20ContractABI = [
                // balanceOf
                {
                  "constant":true,
                  "inputs":[{"name":"_owner","type":"address"}],
                  "name":"balanceOf",
                  "outputs":[{"name":"balance","type":"uint256"}],
                  "type":"function"
                },
                // decimals
                {
                  "constant":true,
                  "inputs":[],
                  "name":"decimals",
                  "outputs":[{"name":"","type":"uint8"}],
                  "type":"function"
                }
            ];

            const contract = new Contract(currency.contractAddress, minumumERC20ContractABI, this.blockchainProvider);

            return new Big(await contract.balanceOf(address).toString());
        } else {
            throw new Error(ErrorReason.NotImplemented);
        }
    }

    async createTransaction(request: BlockchainTransactionRequest, sender: BlockchainAddress): Promise<EthereumTransaction> {
        return {
            to: request.to,
            value: request.value,
            gasLimit: this.standardGasLimit, // should be estimated if data is sent
            gasPrice: await this.getGasPrice(),
            nonce: await this.blockchainProvider.getTransactionCount(sender, "pending"),
            chainID: (await this.blockchainProvider.getNetwork()).chainId
        };
    }

    async sendSignedTransaction(transaction: string): Promise<void> {
        await this.blockchainProvider.sendTransaction(transaction);
    }

    // MARK: Helper
    getChecksummedAddress(address: string): string {
        return getAddress(address);
    }

    async hasEnoughBalance(transaction: EthereumTransaction, address: string): Promise<boolean> {
        const gasPrice = await this.getGasPrice();
        const balance = await this.getBaseUnitBalance(address, this.nativeCurrency);
        const requiredBalance = transaction.value.add(gasPrice.mul(this.standardGasLimit));

        return requiredBalance.lte(balance);
    }

    parseBaseUnitAmount(amount: string): Big {
        return new Big(parseUnits(amount, "wei").toString());
    }

    parseStandardUnitAmount(baseUnitAmount: string): Big {
        return new Big(parseUnits(baseUnitAmount, "ether").toString());
    }

    // MARK: - Private Methods
    private async getGasPrice(): Promise<Big> {
        return new Big((await this.blockchainProvider.getGasPrice()).toString());
    }
    
}