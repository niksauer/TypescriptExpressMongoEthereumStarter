import Big from "big.js";
import { BlockchainNetworkID, BlockchainAddress } from "../../model/Contract";
import { BlockchainWallet } from "./BlockchainWallet"; 
import { ICryptoCurrency } from "../../model/currency/Currency";

export interface BlockchainTransactionRequest {
    to: BlockchainAddress;
    value: Big;
}

export interface BlockchainTransaction {
    to: BlockchainAddress;
    value: Big;
}

export interface BlockchainService {
    readonly networkID: BlockchainNetworkID;
    
    createWallet(): BlockchainWallet; 
    unlockWallet(encryptedWallet: string, password: string): Promise<BlockchainWallet>;
    getChecksummedAddress(address: string): string;
    getBaseUnitBalance(address: string, currency: ICryptoCurrency): Promise<Big>;
    createTransaction(request: BlockchainTransactionRequest, sender: BlockchainAddress): Promise<BlockchainTransaction>;
    sendSignedTransaction(signedTransaction: string): Promise<void>;
    hasEnoughBalance(transaction: BlockchainTransaction, address: BlockchainAddress): Promise<boolean>;
    parseBaseUnitAmount(amount: string): Big;
    parseStandardUnitAmount(baseUnitAmount: string): Big;
}