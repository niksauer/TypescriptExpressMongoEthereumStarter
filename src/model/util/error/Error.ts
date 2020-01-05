export enum ErrorReason {
    // internal known errors (if not in debug mode)
    MiddlewareNotInitialized = "MIDDLEWARE_NOT_INITIALIZED",
    DatabaseUnreachable = "DATABASE_UNREACHABLE",
    InvalidCryptoCompareResponse = "INVALID_CRYPTO_COMPARE_API_RESPONSE",
    CurrencyConversionFailed = "CURRENCY_CONVERSION_FAILED",
    UnknownStoredMimeType = "UNKNOWN_STORED_MIME_TYPE",
    WalletDecryptionFailed = "WALLET_DECRYPTION_FAILED",

    // external unknown error responses
    InternalServerError = "INTERNAL_SERVER_ERROR",

    // external known error responses
    ValidationError = "VALIDATION_ERROR",
    UploadError = "UPLOAD_ERROR",
    
    RouteNotFound = "ROUTE_NOT_FOUND",
    NotImplemented = "NOT_IMPLEMENTED",
    
    Unauthorized = "UNAUTHORIZED",
    AccountNotFound = "ACCOUNT_NOT_FOUND", // used by auth middleware, not catched
    Forbidden = "FORBIDDEN",
    AccountExists = "ACCOUNT_ALREADY_EXISTS",
    AddressOccupied = "ADDRESS_ALREADY_IN_USE",
    DriverNotFound = "DRIVER_NOT_FOUND",
    WalletNotFound = "WALLET_NOT_FOUND",
    ImageNotFound = "IMAGE_NOT_FOUND",
    TransactionNotFound = "TRANSACTION_NOT_FOUND",
    ExternalWalletTransfer = "EXTERNAL_WALLET_TRANSFER",
    InsufficientBalance = "INSUFFICIENT_BALANCE",
    TransferToSelf = "TRANSFER_TO_SELF",

    InvalidMimeType = "INVALID_MIME_TYPE",
}

export class Error {
    
    // MARK: - Public Properties
    statusCode: number;
    reason: ErrorReason;

    // MARK: - Private Properties
    private statusCodeForErrorReason = new Map<ErrorReason, number>([
        [ErrorReason.ValidationError, 400],
        [ErrorReason.UploadError, 400],

        [ErrorReason.RouteNotFound, 404],
        [ErrorReason.NotImplemented, 500],

        [ErrorReason.Unauthorized, 401],
        [ErrorReason.Forbidden, 403],
        [ErrorReason.DriverNotFound, 404],
        [ErrorReason.WalletNotFound, 404],
        [ErrorReason.TransactionNotFound, 404],
        [ErrorReason.ImageNotFound, 404],
        [ErrorReason.AccountExists, 409],
        [ErrorReason.AddressOccupied, 409],
        [ErrorReason.ExternalWalletTransfer, 409],
        [ErrorReason.InsufficientBalance, 409],
        [ErrorReason.TransferToSelf, 409]
    ]);

    private knownExternalErrors: ErrorReason[] = [
        ErrorReason.ValidationError,
        ErrorReason.UploadError,

        ErrorReason.RouteNotFound,
        ErrorReason.NotImplemented,

        ErrorReason.Unauthorized,
        ErrorReason.Forbidden,
        ErrorReason.AccountExists,
        ErrorReason.AddressOccupied,
        ErrorReason.DriverNotFound,
        ErrorReason.WalletNotFound,
        ErrorReason.TransactionNotFound,
        ErrorReason.ImageNotFound,
        ErrorReason.ExternalWalletTransfer,
        ErrorReason.InsufficientBalance,
        ErrorReason.TransferToSelf
    ];

    // MARK: - Initialization
    constructor(reason: ErrorReason) {
        // super(reason);

        this.reason = reason;
        this.statusCode = this.statusCodeForErrorReason.get(reason) || 500;
    }

    // MARK: - Public Methods
    isKnownExternally(debug?: boolean): boolean { 
        if (debug != undefined && debug == true) {
            return true;
        }

        return this.knownExternalErrors.includes(this.reason);
    }

}