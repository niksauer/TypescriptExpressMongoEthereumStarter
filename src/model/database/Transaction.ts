import mongoose, { Document, Schema } from "mongoose";
import { VALID_DATA_POINT_UNITS, ITransactionDocument, toPublicTransaction, PublicTransaction } from "../../interfaces/database/ITransaction";
import { VALID_QUOTE_CURRENCY_CODES, VALID_BASE_CURRENCY_CODES } from "../currency/CurrencyManager";
import { DatabaseCollection } from "../../interfaces/database/IDatabase";

export interface TransactionDocumentPrototype {
    _id?: TransactionDocument["id"];
    driverID: TransactionDocument["driverID"];
    date: TransactionDocument["date"];
    value: TransactionDocument["value"];
    contractInteraction?: TransactionDocument["contractInteraction"];
    receiverAddress?: TransactionDocument["receiverAddress"];
    isPending?: TransactionDocument["isPending"];
}

export interface TransactionDocument extends ITransactionDocument, Document {
    id: string;
}

const TransactionSchema: Schema = new Schema({
    // input
    driverID: {
        type: String,
        ref: DatabaseCollection.User,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    // enriched
    value: {
        settled: {
            base: {
                amount: {
                    type: String
                },
                currency: {
                    type: String,
                    enum: VALID_BASE_CURRENCY_CODES
                }
            },
            exchange: {
                date: {
                    type: Date
                },
                rate: {
                    type: Number
                }
            },
            quote: {
                amount: {
                    type: String,
                    required: true,
                },
                currency: {
                    type: String,
                    required: true,
                    enum: VALID_QUOTE_CURRENCY_CODES
                }
            }
        }
    },
    contractInteraction: {
        contract: {
            networkID: {
                type: String
            },
            address: {
                type: String
            },
            currency: {
                type: String,
                enum: VALID_BASE_CURRENCY_CODES
            }
        },
        txHash: {
            type: String,
        },
        isConfirmed: {
            type: Boolean,
        },
        date: {
            type: Date,
        },
        confirmationDate: {
            type: Date
        }
    },
    receiverAddress: {
        type: String
    },
    isPending: {
        type: Boolean,
        required: true,
        default: true
    },
}, { timestamps: true });


TransactionSchema.methods.toPublic = function(settledValue: PublicTransaction["value"]["settled"], currentValue?: PublicTransaction["value"]["current"]): PublicTransaction {    
    const object = this.toObject({ virtuals: true });

    return toPublicTransaction(object, settledValue, currentValue);
};

export const Transaction = mongoose.model<TransactionDocument>(DatabaseCollection.Transaction, TransactionSchema);

export async function clearTransactionCollection() { await Transaction.remove({}).exec(); }