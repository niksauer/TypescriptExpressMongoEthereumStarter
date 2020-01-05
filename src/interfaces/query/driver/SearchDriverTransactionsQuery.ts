import { ValidationError, ValidationErrorReason, KeyValidationError } from "../../../model/util/error/ValidationError";
import { parseBoolean } from "../../../model/util/config/EnvironmentFile";

export interface SearchDriverTransactionsQuery {
    includePending: boolean; // false
    showCurrentValue: boolean; // false
}

// MARK: Query Validation
export function validateSearchDriverTransactionsQuery(object: any): SearchDriverTransactionsQuery {
    const validationErrors: KeyValidationError[] = [];

    if (object.includePending) {
        try {
            object.includePending = parseBoolean(object.includePending);
        } catch {
            validationErrors.push({
                key: "includePending",
                reason: ValidationErrorReason.BooleanRequired
            });
        }
    } else {
        object.includePending = false;
    }

    if (object.showCurrentValue) {
        try {
            object.showCurrentValue = parseBoolean(object.showCurrentValue);
        } catch {
            validationErrors.push({
                key: "showCurrentValue",
                reason: ValidationErrorReason.BooleanRequired
            });
        }
    } else {
        object.showCurrentValue = false;
    }

    if (object.limit) {
        if (typeof object.limit != "number") {
            validationErrors.push({
                key: "limit",
                reason: ValidationErrorReason.NumberRequired
            });
        } else if (object.limit < 0) {
            validationErrors.push({
                key: "limit",
                reason: ValidationErrorReason.NumberNotNegative
            });
        }
    }

    if (object.page) {
        if (typeof object.page != "number") {
            validationErrors.push({
                key: "page",
                reason: ValidationErrorReason.NumberRequired
            });
        } else if (object.page < 0) {
            validationErrors.push({
                key: "page",
                reason: ValidationErrorReason.NumberGreaterThanZero
            });
        }
    }

    if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors);
    }

    return object as SearchDriverTransactionsQuery;
}