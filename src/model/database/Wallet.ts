import mongoose, { Document, Schema } from "mongoose";
import { IWalletDocument, toPublicWallet } from "../../interfaces/database/IWallet";
import { ICurrencyManager } from "../../interfaces/model/currency/ICurrencyManager";
import { VALID_BASE_CURRENCY_CODES, VALID_QUOTE_CURRENCY_CODES } from "../currency/CurrencyManager";
import { DatabaseCollection } from "../../interfaces/database/IDatabase";

export interface WalletDocumentPrototype {
    _id?: WalletDocument["id"];
    isManaged: WalletDocument["isManaged"];
    baseCurrency: WalletDocument["baseCurrency"];
    quoteCurrency: WalletDocument["quoteCurrency"];
    networkID: WalletDocument["networkID"];
    externalAddress?: WalletDocument["externalAddress"];
    managedAddress?: WalletDocument["managedAddress"];
    managedEncryptedWallet?: WalletDocument["managedEncryptedWallet"];
}

export interface WalletDocument extends IWalletDocument, Document {
    id: string;
    externalAddress?: string;
    managedAddress?: string;
    managedEncryptedWallet?: string;
}

const WalletSchema: Schema = new Schema({
    isManaged: {
        type: Boolean,
        required: true
    },
    baseCurrency: {
        type: String,
        required: true,
        enum: VALID_BASE_CURRENCY_CODES,
    },
    quoteCurrency: {
        type: String,
        required: true,
        enum: VALID_QUOTE_CURRENCY_CODES
    },
    networkID: {
        type: String,
        required: true,
    },
    externalAddress: String,
    managedAddress: String,
    managedEncryptedWallet: String
}, { timestamps: true });


WalletSchema.virtual("address").get(function(this: WalletDocument) {
    if (this.isManaged) {
        return this.managedAddress;
    } else {
        return this.externalAddress;
    }
});

WalletSchema.virtual("hasCreatedManagedWallet").get(function(this: WalletDocument) {
    return this.managedAddress != undefined;
});

WalletSchema.methods.toPublic = function(currencyManager: ICurrencyManager) {
    const object = this.toObject({ virtuals: true });

    return toPublicWallet(object, currencyManager);
};

export const Wallet = mongoose.model<WalletDocument>(DatabaseCollection.Wallet, WalletSchema);

export async function clearWalletCollection() { await Wallet.remove({}).exec(); }