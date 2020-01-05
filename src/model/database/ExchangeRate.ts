import mongoose, { Document, Schema } from "mongoose";
import { IExtendedExchangeRateDocument } from "../../interfaces/database/IExchangeRate";
import { DatabaseCollection } from "../../interfaces/database/IDatabase";

export interface ExchangeRateDocumentPrototype {
    exchange: ExchangeRateDocument["exchange"];
    currencyPair: ExchangeRateDocument["currencyPair"];
}

export interface ExchangeRateDocument extends IExtendedExchangeRateDocument, Document {
}

const ExchangeRateSchema = new Schema({
    exchange: {
        date: {
            type: Date,
            required: true
        },
        rate: {
            type: Number,
            required: true
        }
    },
    currencyPair: {
        base: {
            type: String,
            required: true
        },
        quote: {
            type: String,
            required: true
        }
    }
});

// ExchangeRateSchema.methods.toPublic = function() {
//     const object = this.toObject({ virtuals: true });

//     return toPublicExtendedExchangeRate(object);
// };

export const ExchangeRate = mongoose.model<ExchangeRateDocument>(DatabaseCollection.ExchangeRate, ExchangeRateSchema);

export async function clearExchangeRateCollection() { await ExchangeRate.remove({}).exec(); }