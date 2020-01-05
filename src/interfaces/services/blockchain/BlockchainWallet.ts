import { BlockchainTransaction } from "./BlockchainService";

export interface BlockchainWallet {
    address: string;
    encrypt(password: string): Promise<string>;
    signTransaction(transaction: BlockchainTransaction): Promise<string>;
}