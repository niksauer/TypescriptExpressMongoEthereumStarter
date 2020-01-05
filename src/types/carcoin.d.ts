declare module Express {
    export interface Request {
        baseResource: any;
    }
}

declare module jsend {
    export interface jsendCore {
        success(data: Object | null): JSendObject;
    }
}