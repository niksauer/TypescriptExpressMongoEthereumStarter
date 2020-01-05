import { ITransactionDocument, ITransaction, ITransactionPrototype } from "../../database/ITransaction";
import { BlockchainNetworkID, BlockchainAddress } from "../../model/Contract";

export enum TransactionSearchType {
    All,
    Processed,
    Unconfirmed,
    Unprocessed, // aka Incoming
}

// MARK: - Search Conditions
// MARK: All
// eslint-disable-next-line
export interface ITransactionSearchConditions {
}

// MARK: Processed
// eslint-disable-next-line
export interface IProcessedTransactionsSearchConditions {
}

// eslint-disable-next-line
export interface IUnconfirmedTransactionsSearchConditions extends IProcessedTransactionsSearchConditions {
}

// MARK: Unprocessed
// eslint-disable-next-line
export interface IUnprocessedTransactionsSearchConditions {
}

// MARK: - Search Inputs
export interface OptionalTransactionsSearchInput {
    driverID?: ITransaction["driverID"];
}

export const OPTIONAL_TRANSACTION_SEARCH_INPUT_KEYS: (keyof OptionalTransactionsSearchInput)[] = [
    "driverID",
];

// MARK: Processed
export interface OptionalProcessedTransactionsSearchInput extends OptionalTransactionsSearchInput {
    contractAddress?: BlockchainAddress;
    receiverAddress?: ITransaction["receiverAddress"];
}

export const OPTIONAL_PROCESSED_TRANSACTION_SEARCH_INPUT_KEYS: (keyof OptionalProcessedTransactionsSearchInput)[] = [
    "driverID",
    "contractAddress",
    "receiverAddress",
];

export interface ProcessedTransactionsSearchInput extends OptionalProcessedTransactionsSearchInput {
    networkID: BlockchainNetworkID;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UnconfirmedTransactionsSearchInput extends ProcessedTransactionsSearchInput {
    
}

// MARK: Unprocessed
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UnprocessedTransactionsSearchInput extends OptionalTransactionsSearchInput {

}

export type TransactionSearchConditions<Type extends TransactionSearchType> = 
    Type extends TransactionSearchType.All ? ITransactionSearchConditions : (
        Type extends TransactionSearchType.Processed ? IProcessedTransactionsSearchConditions : 
            Type extends TransactionSearchType.Unconfirmed ? IUnconfirmedTransactionsSearchConditions : 
                Type extends TransactionSearchType.Unprocessed ? IUnprocessedTransactionsSearchConditions : undefined
);

export type TransactionSearchInput<Type extends TransactionSearchType> =
    Type extends TransactionSearchType.All ? OptionalTransactionsSearchInput : (    
        Type extends TransactionSearchType.Processed ? ProcessedTransactionsSearchInput : 
            Type extends TransactionSearchType.Unconfirmed ? UnconfirmedTransactionsSearchInput : 
                Type extends TransactionSearchType.Unprocessed ? UnprocessedTransactionsSearchInput : undefined
);

// MARK: - Service
// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface ITransactionService {
    searchTransactions(searchConditions: any): Promise<ITransactionDocument[]>;
    searchTransactions(searchConditions: any, limit: number, skip: number): Promise<ITransactionDocument[]>;
    countTransactions(searchConditions: any): Promise<number>;
    createTransaction(prototype: ITransactionPrototype): Promise<ITransaction>;
    saveTransaction(transaction: ITransaction): Promise<void>;

    getSearchConditions<Type extends TransactionSearchType>(type: Type, input: TransactionSearchInput<Type>): TransactionSearchConditions<Type>;
}