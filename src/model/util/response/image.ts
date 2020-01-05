import { Response, NextFunction } from "express";
import fileSystem from "fs";
import fileType from "file-type";
import readChunk from "read-chunk";
import { Error, ErrorReason } from "../error/Error";

export async function respondWithImage(filePath: string, response: Response, next: NextFunction) {
    const buffer = await readChunk(filePath, 0, 4100);
    const storedMimeType = fileType(buffer);

    if (!storedMimeType) {
        throw new Error(ErrorReason.UnknownStoredMimeType);
    }

    response.setHeader("Content-Type", storedMimeType.mime);
    fileSystem.createReadStream(filePath).pipe(response);
}