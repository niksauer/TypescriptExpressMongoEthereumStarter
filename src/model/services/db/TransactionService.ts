import { ITransactionService, TransactionSearchType, TransactionSearchInput, TransactionSearchConditions, IProcessedTransactionsSearchConditions, IUnconfirmedTransactionsSearchConditions, IUnprocessedTransactionsSearchConditions, ProcessedTransactionsSearchInput, UnconfirmedTransactionsSearchInput, UnprocessedTransactionsSearchInput, OptionalProcessedTransactionsSearchInput, OptionalTransactionsSearchInput, OPTIONAL_PROCESSED_TRANSACTION_SEARCH_INPUT_KEYS, OPTIONAL_TRANSACTION_SEARCH_INPUT_KEYS } from "../../../interfaces/services/db/ITransactionService";
import { TransactionDocument, Transaction, TransactionDocumentPrototype } from "../../database/Transaction";
import { ITransactionPrototype } from "../../../interfaces/database/ITransaction";
import { Error, ErrorReason } from "../../util/error/Error";
import { BlockchainNetworkID } from "../../../interfaces/model/Contract";
import { assignOptionalProperties } from "../../util/helper";

// MARK: - Search Conditions
// MARK: Processed
export interface ProcessedTransactionsSearchConditions extends IProcessedTransactionsSearchConditions {
    "contractInteraction.contract.networkID": BlockchainNetworkID;
}

export interface UnconfirmedTransactionsSearchConditions extends IUnconfirmedTransactionsSearchConditions, ProcessedTransactionsSearchConditions {
    "contractInteraction.isConfirmed": false;
    "contractInteraction.txHash": { $ne: null };
    isPending: true;
}

// MARK: Unprocessed
export interface UnprocessedTransactionsSearchConditions extends IUnprocessedTransactionsSearchConditions {
    contractInteraction: null;
    isPending: true;
}

// MARK: - Service
export class TransactionService implements ITransactionService {
    
    // MARK: - Private Properties

    // MARK: - Initialization

    // MARK: - Public Methods
    async createTransaction(prototype: ITransactionPrototype): Promise<TransactionDocument> {        
        const transaction = new Transaction(prototype as TransactionDocumentPrototype);

        return await transaction.save();
    }

    async saveTransaction(transaction: TransactionDocument): Promise<void> {
        await transaction.save();
    }
    
    async searchTransactions(searchConditions: any): Promise<TransactionDocument[]>;
    async searchTransactions(searchConditions: any, limit?: number, skip?: number): Promise<TransactionDocument[]> {
        if (limit != undefined && skip != undefined) {
            return await Transaction.find(searchConditions).limit(limit).skip(skip).exec();
        } else {
            return await Transaction.find(searchConditions);    
        }
    }

    async countTransactions(searchConditions: any): Promise<number> {
        return await Transaction.countDocuments(searchConditions);
    }

    getSearchConditions<Type extends TransactionSearchType, Result extends TransactionSearchConditions<Type>>(searchType: Type, input: TransactionSearchInput<Type>): Result {
        const targetKeyForInputKey = {
            contractAddress: "contractInteraction.contract.address"
        };

        switch (searchType) {
            case TransactionSearchType.All: {
                const typedInput = input as TransactionSearchInput<TransactionSearchType.All>;
                
                const result = assignOptionalProperties({}, typedInput, OPTIONAL_TRANSACTION_SEARCH_INPUT_KEYS, targetKeyForInputKey);
            
                return result;
            }
            case TransactionSearchType.Processed: {
                const typedInput = input as TransactionSearchInput<TransactionSearchType.Processed>;

                const conditions: ProcessedTransactionsSearchConditions = {
                    "contractInteraction.contract.networkID": typedInput.networkID,
                };
                
                const result = assignOptionalProperties(conditions, input, OPTIONAL_PROCESSED_TRANSACTION_SEARCH_INPUT_KEYS, targetKeyForInputKey);
            
                return result;
            }
            case TransactionSearchType.Unconfirmed: {
                const typedInput = input as TransactionSearchInput<TransactionSearchType.Unconfirmed>;

                const conditions: UnconfirmedTransactionsSearchConditions = {
                    "contractInteraction.contract.networkID": typedInput.networkID,
                    "contractInteraction.isConfirmed": false,
                    "contractInteraction.txHash": { $ne: null },
                    isPending: true
                };

                const result = assignOptionalProperties(conditions, input, OPTIONAL_PROCESSED_TRANSACTION_SEARCH_INPUT_KEYS, targetKeyForInputKey);

                return result;
            }
            case TransactionSearchType.Unprocessed: {
                const conditions: UnprocessedTransactionsSearchConditions = {
                    isPending: true,
                    contractInteraction: null
                };

                const result = assignOptionalProperties(conditions, input, OPTIONAL_TRANSACTION_SEARCH_INPUT_KEYS, targetKeyForInputKey);

                return result;
            }
            default:
                throw new Error(ErrorReason.NotImplemented);
        }
    }

}