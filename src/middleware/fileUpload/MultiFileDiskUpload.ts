import multer from "multer";
import { MultiFileUploadMiddleware } from "./MultiFileUpload";
import { MimeType } from "./FileUploadError";

export type FileNameHandler = (req: Express.Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => void;

export interface MultiFileDiskStorageUploadMiddlewareOptions {
    fileKeys: string[];
    mimeTypesForFileKey: { [key: string]: MimeType[] };
    destination: string;
    fileName?: FileNameHandler;
}

export class MultiFileDiskStorageUploadMiddleware extends MultiFileUploadMiddleware {

    // MARK: - Public Properties
    readonly destination: string;

    // MARK: - Private Properties
    protected storage: multer.StorageEngine;

    // MARK: - Initialization
    constructor(options: MultiFileDiskStorageUploadMiddlewareOptions) {
        super(options.fileKeys, options.mimeTypesForFileKey);
        
        this.destination = options.destination;
        
        this.storage = multer.diskStorage({
            destination: options.destination,
            filename: options.fileName
        });
    }

}