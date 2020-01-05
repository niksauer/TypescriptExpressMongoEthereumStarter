import { ValidationError, ValidationErrorReason, KeyValidationError } from "../../../model/util/error/ValidationError";
import { parseBoolean } from "../../../model/util/config/EnvironmentFile";

export interface GetBalanceQuery {
    includePending: boolean; // default: false
}

export function validateGetBalanceQuery(object: any): GetBalanceQuery {
    const validationErrors: KeyValidationError[] = [];

    if (object.includePending) {
        try {
            object.includePending = parseBoolean(object.includePending);
        } catch (error) {
            validationErrors.push({
                key: "includePending",
                reason: ValidationErrorReason.BooleanRequired
            });
        }
    } else {
        object.includePending = false;
    }

    if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors);
    }

    return object as GetBalanceQuery;
}