import { MultiFileDiskStorageUploadMiddleware, FileNameHandler } from "./MultiFileDiskUpload";
import { MimeType } from "./FileUploadError";

export interface SingleFileDiskStorageUploadMiddlewareOptions {
    fileKey: string;
    mimeTypes: MimeType[];
    destination: string;
    fileName?: FileNameHandler;
}

export class SingleFileDiskStorageUploadMiddleware extends MultiFileDiskStorageUploadMiddleware {
    
    // MARK: - Initialization
    constructor(options: SingleFileDiskStorageUploadMiddlewareOptions) {
        const mimeTypesForFile: { [key: string]: MimeType[] } = {};
        mimeTypesForFile[options.fileKey] = options.mimeTypes;

        super({
            fileKeys: [options.fileKey],
            mimeTypesForFileKey: mimeTypesForFile, 
            destination: options.destination,
            fileName: options.fileName
        });
    }

}