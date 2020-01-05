import { KeyFileUploadError } from "../../../middleware/fileUpload/FileUploadError";
import { Error, ErrorReason } from "./Error";

export class FileUploadError extends Error {
    
    // MARK: - Public Properties
    get response(): { [key: string]: string } {
        return this.uploadErrors.reduce((result: { [key: string]: string }, uploadError) => {
            if (result[uploadError.key]) {
                // if a property with the 'key' already exists in the result, then append to that
                Object.assign(result[uploadError.key], uploadError.reason);
            } else {
                // else add the key-value pair to the result object.
                const message = uploadError.reason.message;
                result[uploadError.key] = message;
            }
            
            return result;
        }, {});
    }

    // MARK: - Private Properties
    private uploadErrors: KeyFileUploadError[];

    // MARK: - Initialization
    constructor(uploadErrors: KeyFileUploadError[]) {
        super(ErrorReason.UploadError);
        
        this.uploadErrors = uploadErrors;
    }

}