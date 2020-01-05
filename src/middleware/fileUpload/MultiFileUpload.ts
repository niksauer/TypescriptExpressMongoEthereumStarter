import { Request, Response, NextFunction, RequestHandler, Handler } from "express";
import multer from "multer";
import { stringToEnumValue } from "../../model/util/helper";
import { Error, ErrorReason } from "../../model/util/error/Error";
import { Middleware } from "../../interfaces/middleware/Middleware";
import { InvalidMimeTypeError, FileNotUploadedError, MimeType, FileUploadErrorReason, KeyFileUploadError } from "./FileUploadError";
import { FileUploadError } from "../../model/util/error/FileUploadError";

export abstract class MultiFileUploadMiddleware implements Middleware {

    // MARK: - Private Properties
    readonly files: string[];
    readonly mimeTypesForFile: { [key: string]: MimeType[] };

    // MARK: - Private Properties
    private middleware?: RequestHandler;

    // MARK: - Private Properties
    protected abstract storage: multer.StorageEngine;

    // MARK: - Initialization
    constructor(files: string[], mimeTypesForFile: { [key: string]: MimeType[] }) {
        this.files = files;
        this.mimeTypesForFile = mimeTypesForFile;

        // binding
        this.perform = this.perform.bind(this);
    }

    // MARK: - Public Methods
    async initialize(): Promise<Handler> {
        this.middleware = multer({
            storage: this.storage,
            fileFilter: (request, file, callback) => {         
                const acceptedMimeTypes = this.mimeTypesForFile[file.fieldname];

                if (!acceptedMimeTypes) {
                    return callback(null, true);
                }

                // TODO: get mime type from magic bytes of file buffer
                const mimeType = stringToEnumValue<typeof MimeType, MimeType>(MimeType, file.mimetype);

                if (!acceptedMimeTypes.includes(mimeType)) {
                    (request as any).fileUploadErrors[file.fieldname] = new InvalidMimeTypeError(acceptedMimeTypes);

                    return callback(null, false);
                }

                callback(null, true);
            }
        }).fields(this.files.map(file => { return { name: file }; }));

        return this.middleware;
    }

    // MARK: - Public Methods
    perform(request: Request, response: Response, next: NextFunction) {
        (request as any).fileUploadErrors = {};
        // private fileErrors: { [file: string]: FileUploadError } = {};

        if (!this.middleware) {
            throw new Error(ErrorReason.MiddlewareNotInitialized);
        }

        this.middleware(request, response, (error) => {
            if (error) {
                return next(error);
            }

            const uploadErrors: KeyFileUploadError[] = [];

            const parsedFilesForFile = request.files as unknown as { [fieldname: string]: Express.Multer.File[] | undefined } | undefined;

            if (!parsedFilesForFile) {
                // no files have been uploaded
                // (request as any).fileUploadErrors = "no files";

                uploadErrors.push(...this.files.map(file => {
                    return {
                        key: file,
                        reason: new FileNotUploadedError()
                    };
                }));
            } else {
                for (const requiredFile of this.files) {
                    const parsedFiles = parsedFilesForFile[requiredFile];
        
                    if (!parsedFiles || parsedFiles.length == 0) {
                        if ((request as any).fileUploadErrors[requiredFile] == undefined) {
                            // file was not uploaded
                            (request as any).fileUploadErrors[requiredFile] = new FileNotUploadedError();
                        } else {
                            // file did not pass previous checks
                        }
                    }
                }

                const fileUploadErrors = (request as any).fileUploadErrors as { [key: string]: FileUploadErrorReason };
                
                for (const key in fileUploadErrors) {
                    uploadErrors.push({
                        key: key,
                        reason: fileUploadErrors[key],
                    });
                } 
            }

            if (uploadErrors.length > 0) {
                return next(new FileUploadError(uploadErrors));
            }

            next();
        });
    }

}