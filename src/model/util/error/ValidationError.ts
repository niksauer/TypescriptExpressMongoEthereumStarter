import { Error, ErrorReason } from "./Error";
import { VALID_QUOTE_CURRENCY_CODES } from "../../currency/CurrencyManager";

export enum ValidationErrorReason {
    CurrencyCodeRequired,
    InvalidCurrency,
    CurrencyAmountRequired,
    InvalidAddressChecksum,
    ReceiverAddressRequired,
    QuoteCurrencyRequired,
    QuoteCurrencyOutOfRange,
    DataPointValueRequired,
    PasswordRequired,
    BaseCurrencyAmountRequired,
    InvalidBaseCurrencyAmount,
    EndBeforeStart,
    CoffeeCountRequired,
    DescriptionRequired,
    
    NumberNotNegative,
    NumberGreaterThanZero,
    NumberGreaterThanOne,
    
    // type error
    IntegerRequired,
    NumberRequired,
    StringRequired,
    UTCTimestampRequired,
    BooleanRequired,

    // file upload error
    LogoRequired,
    InvalidLogoMemeType,
}


export interface KeyValidationError {
    key: string;
    reason: ValidationErrorReason;
}

export class ValidationError extends Error {
    
    // MARK: - Public Class Properties
    static readonly messageForReason = new Map<ValidationErrorReason, string>([
        [ValidationErrorReason.InvalidAddressChecksum, "has invalid checksum"],
        [ValidationErrorReason.ReceiverAddressRequired, "is required"],
        [ValidationErrorReason.QuoteCurrencyRequired, "is required"],
        [ValidationErrorReason.QuoteCurrencyOutOfRange, `must be in range [${VALID_QUOTE_CURRENCY_CODES}]`],
        [ValidationErrorReason.PasswordRequired, "is required when creating a new managed wallet or transferring funds"],
        [ValidationErrorReason.BaseCurrencyAmountRequired, "is required"],
        [ValidationErrorReason.InvalidBaseCurrencyAmount, "must be parsable to Big"],
        [ValidationErrorReason.EndBeforeStart, "must be later than startAt"],
        
        [ValidationErrorReason.NumberNotNegative, "must be equal or greater than 0"],
        [ValidationErrorReason.NumberGreaterThanZero, "must be greater than 0"],
        [ValidationErrorReason.NumberGreaterThanOne, "must be greater than 1"],
        
        // type error
        [ValidationErrorReason.IntegerRequired, "must be an integer"],
        [ValidationErrorReason.NumberRequired, "must be a number"],
        [ValidationErrorReason.StringRequired, "must be a string"],
        [ValidationErrorReason.UTCTimestampRequired, "must be a UTC string timestamp"],
        [ValidationErrorReason.BooleanRequired, "must be a boolean"],
    ]);

    // MARK: - Public Properties
    get response(): { [key: string]: string } {
        return this.validationErrors.reduce((result: { [key: string]: string }, validationError) => {
            if (result[validationError.key]) {
                // if a property with the 'key' already exists in the result, then append to that
                Object.assign(result[validationError.key], validationError.reason);
            } else {
                // else add the key-value pair to the result object.
                const message = ValidationError.messageForReason.get(validationError.reason) ?? "";
                result[validationError.key] = message;
            }

            return result;
        }, {});
    }

    // MARK: - Private Properties
    private validationErrors: KeyValidationError[];

    // MARK: - Initialization
    constructor(validationErrors: KeyValidationError[]) {
        super(ErrorReason.ValidationError);
        
        this.validationErrors = validationErrors;
    }

}

