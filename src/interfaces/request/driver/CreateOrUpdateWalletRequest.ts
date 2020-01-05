import { ValidationErrorReason, ValidationError, KeyValidationError } from "../../../model/util/error/ValidationError";
import { BlockchainService } from "../../services/blockchain/BlockchainService";
import { VALID_QUOTE_CURRENCY_CODES } from "../../../model/currency/CurrencyManager";
import { IWallet } from "../../database/IWallet";

export interface CreateOrUpdateWalletRequest {
    quoteCurrency: IWallet["quoteCurrency"];
    address?: IWallet["address"];
    password?: string;
}

export function validateCreateOrUpdateWalletRequest(object: any, blockchainService: BlockchainService): CreateOrUpdateWalletRequest {
    const validationErrors: KeyValidationError[] = [];

    if (!object.quoteCurrency) {
        validationErrors.push({ 
            key: "quoteCurrency",
            reason: ValidationErrorReason.QuoteCurrencyRequired
        });
    } else if (!VALID_QUOTE_CURRENCY_CODES.includes(object.quoteCurrency)) {
        validationErrors.push({ 
            key: "quoteCurrency",
            reason: ValidationErrorReason.QuoteCurrencyOutOfRange
        });
    }

    if (object.address) {
        try {
            // verifies an address and returns checksummed version
            object.address = blockchainService.getChecksummedAddress(object.address);
        } catch {
            validationErrors.push({ 
                key: "address",
                reason: ValidationErrorReason.InvalidAddressChecksum
            });
        }
    }

    if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors);
    }

    return object as CreateOrUpdateWalletRequest;
};