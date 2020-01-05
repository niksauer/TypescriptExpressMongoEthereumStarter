import { CurrencyCode } from "./currency/Currency";

export type BlockchainNetworkID = string;
export type BlockchainPrivateKey = string;
export type BlockchainAddress = string;
export type BlockchainTxHash = string;

export interface ContractInfo {
    networkID: BlockchainNetworkID;
    address: BlockchainAddress;
    currency: CurrencyCode;
}

export enum ContractInteractionType {
}

export interface ContractInteraction<Type extends ContractInteractionType> {
    type: Type;
    txHash: BlockchainTxHash;
    isConfirmed: boolean;
    date: Date;
    confirmationDate?: Date;
}