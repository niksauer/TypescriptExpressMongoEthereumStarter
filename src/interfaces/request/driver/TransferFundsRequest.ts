import { ValidationErrorReason, ValidationError, KeyValidationError } from "../../../model/util/error/ValidationError";
import { Error, ErrorReason } from "../../../model/util/error/Error";
import { BlockchainService } from "../../services/blockchain/BlockchainService";
import Big from "big.js";
import { CurrencyCode } from "../../model/currency/Currency";
import { ICurrencyManager } from "../../model/currency/ICurrencyManager";
import { BlockchainAddress } from "../../model/Contract";

export interface TransferFundsRequest {
    password: string;
    receiverAddress: BlockchainAddress;
    amount: Big; // standard unit amount
    currency: CurrencyCode;
}

export function validateTransferFundsRequest(object: any, senderAddress: string, blockchainService: BlockchainService, currencyManager: ICurrencyManager): TransferFundsRequest {
    const validationErrors: KeyValidationError[] = [];

    if (!object.password) {
        validationErrors.push({ 
            key: "password",
            reason: ValidationErrorReason.PasswordRequired
        });
    }

    if (!object.receiverAddress) {
        validationErrors.push({ 
            key: "receiverAddress",
            reason: ValidationErrorReason.ReceiverAddressRequired
        });
    } else {
        try {
            // verifies an address and returns checksummed version
            object.receiverAddress = blockchainService.getChecksummedAddress(object.receiverAddress);

            if (object.receiverAddress == senderAddress) {
                throw new Error(ErrorReason.TransferToSelf);
            }
        } catch {
            validationErrors.push({ 
                key: "receiverAddress",
                reason: ValidationErrorReason.InvalidAddressChecksum
            });
        }
    }

    if (!object.amount) {
        validationErrors.push({ 
            key: "amount",
            reason: ValidationErrorReason.CurrencyAmountRequired
        });
    } else if (typeof object.amount != "string") {
        validationErrors.push({ 
            key: "amount",
            reason: ValidationErrorReason.StringRequired
        });
    } else {
        object.amount = new Big(object.amount);
    }

    if (!object.currency) {
        validationErrors.push({ 
            key: "currency",
            reason: ValidationErrorReason.CurrencyCodeRequired
        });
    } else {
        const currency = currencyManager.getCurrency(object.currency);

        if (!currency) {
            validationErrors.push({ 
                key: "currency",
                reason: ValidationErrorReason.InvalidCurrency
            });
        }
    }

    if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors);
    }

    return object as TransferFundsRequest;
}