export enum JSendResponseStatus {
    Success = "success",
    Fail = "fail",
    Error = "error"
}

export type JSendSuccessDataResponse<DataKey extends string, Data> = {
    [K in DataKey]: Data;
};

export interface JSendSuccessResponse<DataKey extends string, Data> {
    status: JSendResponseStatus.Success;
    data: JSendSuccessDataResponse<DataKey, Data>;
}

export interface JSendFailResponse {
    status: JSendResponseStatus.Fail;
    data: any;
}

export interface JSendErrorResponse {
    status: JSendResponseStatus.Error;
    message: string;
    code: number;
    data: any;
}

export function getJSendSuccessResponse<DataKey extends string, Data>(object: any): JSendSuccessResponse<DataKey, Data> {
    return object as JSendSuccessResponse<DataKey, Data>;
}