import { Request, Response, NextFunction } from "express";
import paginate from "express-paginate";

export type JSendPartialResponse<DocumentsKey extends string, Document> = {
    [K in DocumentsKey]: Document[];
} & {
    limit?: number;
    page?: number;
    hasMore?: boolean;
    count: number;
}

export async function getJSendPartialResponse<DocumentsKey extends string, Document>(documentsKey: DocumentsKey, request: Request, documentResult: (limit: number, skip: number) => Promise<{ documents: Document[]; totalDocumentsCount: number }>): Promise<JSendPartialResponse<DocumentsKey, Document>> {
    const limit = request.query.limit;
    const skip = request.skip!;
    const page = request.query.page;

    const { documents, totalDocumentsCount } = await documentResult(limit, skip); 

    const totalPageCount = Math.ceil(totalDocumentsCount / limit);
    const hasMore = paginate.hasNextPages(request)(totalPageCount);

    const response: any = {};

    if (limit > 0) {
        response.limit = limit;
        response.page = page;
        response.hasMore = hasMore;
        response.count = documents.length;
    }
    
    response[documentsKey] = documents;

    return response;
}

export async function getCustomJSendPartialResponse<DocumentsKey extends string, Document>(documentsKey: DocumentsKey, limit: number, page: number, documentResult: () => Promise<{ documents: Document[]; hasMore: boolean }>): Promise<JSendPartialResponse<DocumentsKey, Document>> {
    const { documents, hasMore } = await documentResult(); 

    const response: any = {};

    if (limit > 0) {
        response.limit = limit;
        response.page = page;
        response.hasMore = hasMore;
        response.count = documents.length;
    }
    
    response[documentsKey] = documents;

    return response;
}