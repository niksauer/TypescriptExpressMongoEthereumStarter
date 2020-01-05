export enum MimeType {
    JPG = "image/jpeg",
    PNG = "image/png"
}

export const MIME_TYPES: MimeType[] = [
    MimeType.JPG,
    MimeType.PNG
];

export abstract class FileUploadErrorReason {
    abstract message: string;
}

export class InvalidMimeTypeError extends FileUploadErrorReason {    
    get message(): string {
        return `mime type must be in range [${this.acceptedMimeTypes.join(", ")}]`;
    }
    
    constructor(private acceptedMimeTypes: MimeType[]) {
        super();
    }
}

export class FileNotUploadedError extends FileUploadErrorReason {
    message = "is required"
}

export interface KeyFileUploadError {
    key: string;
    reason: FileUploadErrorReason;
}