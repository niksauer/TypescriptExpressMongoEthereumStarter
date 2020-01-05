import { Request, Response, NextFunction } from "express";
import { ErrorReason, Error } from "../model/util/error/Error";
import { injectable, inject } from "tsyringe";
import { Dependency } from "../make";
import { validateSearchDriverTransactionsQuery } from "../interfaces/query/driver/SearchDriverTransactionsQuery";
import { IWalletService } from "../interfaces/services/db/IWalletService";
import { ITransactionService, TransactionSearchType } from "../interfaces/services/db/ITransactionService";
import { TransactionService } from "../model/services/db/TransactionService";
import { validateTransferFundsRequest } from "../interfaces/request/driver/TransferFundsRequest";
import { validateGetBalanceQuery } from "../interfaces/query/driver/GetBalanceQuery";
import { validateCreateOrUpdateWalletRequest } from "../interfaces/request/driver/CreateOrUpdateWalletRequest";
import { BlockchainService } from "../interfaces/services/blockchain/BlockchainService";
import { toPublicDriver, IDriverDocument } from "../interfaces/database/IDriver";
import { getJSendPartialResponse } from "../model/util/response/JSendPartialResponse";
import { PublicTransaction, ITransactionDocument, getTransactionValue } from "../interfaces/database/ITransaction";
import { IDriverService } from "../interfaces/services/db/IUserService";
import { ICurrencyManager } from "../interfaces/model/currency/ICurrencyManager";
import { IExchange } from "../interfaces/model/daemon/IExchange";
import Big from "big.js";
import { ILogger } from "../interfaces/model/ILogger";
import { PendingBlockchainValue, StandardCurrencyPairAmount, OptionalSettledBlockchainValue } from "../interfaces/model/currency/Value";
import { assert, AssertError } from "../model/util/error/AssertError";
import { ICryptoCurrency } from "../interfaces/model/currency/Currency";

@injectable()
export class DriverController {

    // MARK: - Private Properties
    private driverService: IDriverService;
    private walletService: IWalletService;
    private transactionService: ITransactionService;
    private blockchainService: BlockchainService;
    private exchange: IExchange;
    private currencyManager: ICurrencyManager;
    private logger: ILogger;

    // MARK: - Initilization
    constructor(
        @inject(Dependency.DriverService) driverService: IDriverService,
        @inject(Dependency.WalletService) walletService: IWalletService,
        @inject(Dependency.BlockchainService) blockchainService: BlockchainService,
        @inject(Dependency.TransactionService) transactionService: TransactionService,
        @inject(Dependency.Exchange) exchange: IExchange,
        @inject(Dependency.CurrencyManager) currencyManager: ICurrencyManager,
        @inject(Dependency.Logger) logger: ILogger
    ) {
        this.driverService = driverService;
        this.walletService = walletService;
        this.blockchainService = blockchainService;
        this.transactionService = transactionService;
        this.exchange = exchange;
        this.currencyManager = currencyManager;
        this.logger = logger;

        this.createDriver = this.createDriver.bind(this);
        this.getDriverByToken = this.getDriverByToken.bind(this);
        this.getDriver = this.getDriver.bind(this);
        this.deleteDriver = this.deleteDriver.bind(this);
        this.getDriverWallet = this.getDriverWallet.bind(this);
        this.createOrUpdateDriverWallet = this.createOrUpdateDriverWallet.bind(this);
        this.deleteDriverWallet = this.deleteDriver.bind(this);
        this.getDriverWalletBalance = this.getDriverWalletBalance.bind(this);
        this.transferDriverWalletFunds = this.transferDriverWalletFunds.bind(this);
        this.searchDriverTransactions = this.searchDriverTransactions.bind(this);
    }

    // MARK: - Public Methods
    /**
     * POST /driver
     * Create driver
     */
    createDriver(request: Request, response: Response, next: NextFunction) {
        const loggedInDriver = request.user as IDriverDocument;
        response.status(201).jsend.success({ driver: toPublicDriver(loggedInDriver) });
        next();
    }

    /**
     * GET /driver
     * Get driver by token
     */
    getDriverByToken(request: Request, response: Response, next: NextFunction) {
        const loggedInDriver = request.user as IDriverDocument;
        response.status(200).jsend.success({ driver: toPublicDriver(loggedInDriver) });
        next();
    }

    /**
     * GET /driver/:driverID
     * Get driver
     */
    getDriver(request: Request, response: Response, next: NextFunction) {
        const requestedDriver = request.baseResource as IDriverDocument;
        response.status(200).jsend.success({ driver: toPublicDriver(requestedDriver) });
        next();
    }

    /**
     * DELETE /driver/:driverID
     * Delete driver
     */
    async deleteDriver(request: Request, response: Response, next: NextFunction) {
        const requestedDriver = request.baseResource as IDriverDocument;
        await this.driverService.deleteDriver(requestedDriver);
        response.status(200).jsend.success(null);
        next();
    }

    /**
     * GET /driver/:driverID/wallet
     * Get wallet
     */
    async getDriverWallet(request: Request, response: Response, next: NextFunction) {
        const requestedDriver = request.baseResource as IDriverDocument;

        if (!requestedDriver.walletID) {
            throw new Error(ErrorReason.WalletNotFound);
        }

        const wallet = await this.walletService.getWallet(requestedDriver.walletID);
        assert(wallet != undefined, AssertError.WalletExpected);

        response.status(200).jsend.success({ wallet: wallet.toPublic(this.currencyManager) });
        next();
    }

    /**
     * POST /driver/:driverID/wallet
     * Create or update wallet
     * 
     * Assuming that the supplied address differs from the previous one and 
     * has not already been occupied by a different driver, a new link to this 
     * wallet address is established. If no address is supplied and the previous 
     * one referred to a non-managed, i.e. linked wallet, the driver will be 
     * reverted to a managed wallet. If no wallet existed previously, a new one 
     * will be created or linked respectively. Additionally updates the quote currency 
     * for balance requests.
     */
    async createOrUpdateDriverWallet(request: Request, response: Response, next: NextFunction) {
        const requestedDriver = request.baseResource as IDriverDocument;

        const walletRequest = validateCreateOrUpdateWalletRequest(request.body, this.blockchainService);

        const result = await this.walletService.createOrUpdateWallet(walletRequest, requestedDriver);

        const statusCode: number = result.created ? 201 : 200;
        response.status(statusCode).jsend.success({ wallet: result.wallet.toPublic(this.currencyManager) });
        next();
    }

    /**
     * DELETE /driver/:driverID/wallet
     * Delete wallet
     */
    async deleteDriverWallet(request: Request, response: Response, next: NextFunction) {
        const requestedDriver = request.baseResource as IDriverDocument;

        if (!requestedDriver.walletID) {
            throw new Error(ErrorReason.WalletNotFound);
        }

        const wallet = await this.walletService.getWallet(requestedDriver.walletID);
        assert(wallet != undefined, AssertError.WalletExpected);

        await this.walletService.deleteWallet(wallet);

        requestedDriver.walletID = undefined;
        await this.driverService.saveDriver(requestedDriver);

        response.status(200).jsend.success(null);
        next();
    }

    /**
     * GET /driver/:driverID/wallet/balance
     * Get wallet balance
     */
    async getDriverWalletBalance(request: Request, response: Response, next: NextFunction) {
        const requestedDriver = request.baseResource as IDriverDocument;

        const query = validateGetBalanceQuery(request.query);

        if (!requestedDriver.walletID) {
            throw new Error(ErrorReason.WalletNotFound);
        }

        const wallet = await this.walletService.getWallet(requestedDriver.walletID);
        assert(wallet != undefined, AssertError.WalletExpected);

        const currencyPair = this.currencyManager.getCurrencyPair(wallet.baseCurrency, wallet.quoteCurrency);
        assert(currencyPair != undefined, AssertError.CurrencyPairExpected);
        assert(currencyPair.base instanceof ICryptoCurrency, AssertError.CryptoCurrencyAsBaseCurrencyExpected);

        const currentBaseUnitBaseCurrencyAmount = await this.blockchainService.getBaseUnitBalance(wallet.address, currencyPair.base);
        const currentStandardUnitBaseCurrencyAmount = this.currencyManager.getStandardUnitCurrencyAmount(currentBaseUnitBaseCurrencyAmount, currencyPair.base);
        const currentStandardUnitQuoteCurrencyConversionResult = await this.currencyManager.convertToStandardUnitQuoteCurrencyAmount(currentStandardUnitBaseCurrencyAmount, currencyPair, this.exchange);

        const currentValue: StandardCurrencyPairAmount = {
            base: {
                amount: currentStandardUnitBaseCurrencyAmount.toString(),
                currency: currencyPair.base.code
            },
            exchange: currentStandardUnitQuoteCurrencyConversionResult.exchangeRate.exchange,
            quote: {
                amount: currentStandardUnitQuoteCurrencyConversionResult.amount.toString(),
                currency: currencyPair.quote.code
            }
        };

        // take query parameter 'includePending' into account and calculate balance accordingly
        let pendingValue: PendingBlockchainValue | undefined;

        if (query.includePending == true) {            
            // aggregate and add value of unconfirmed transactions > incoming transactions (i.e. where blockchain transaction == undefined) cannot be summed up without first converting each items quote currency to driver's quote currency
            
            // unconfirmed
            const unconfirmedTransactionsSearchConditions = Object.assign({}, this.transactionService.getSearchConditions(TransactionSearchType.Unconfirmed, {
                networkID: wallet.networkID,
                driverID: requestedDriver.id,
                receiverAddress: wallet.address
            }));

            const unconfirmedTransactions = await this.transactionService.searchTransactions(unconfirmedTransactionsSearchConditions);
            
            const unconfirmedStandardUnitBaseCurrencyAmount = unconfirmedTransactions.reduce((result, transaction) => {
                assert(transaction.value.settled.base?.amount != undefined, AssertError.SettledBaseCurrencyAmountExpected);

                return result.add(transaction.value.settled.base.amount);
            }, new Big(0));

            const conversionResult = await this.currencyManager.convertToStandardUnitQuoteCurrencyAmount(unconfirmedStandardUnitBaseCurrencyAmount, currencyPair, this.exchange);
            const exchangeRate = conversionResult.exchangeRate;
            const unconfirmedStandardUnitQuoteCurrencyAmount = conversionResult.amount;

            const unconfirmedValue: StandardCurrencyPairAmount = {
                base: {
                    amount: unconfirmedStandardUnitBaseCurrencyAmount.toString(),
                    currency: currencyPair.base.code
                },
                exchange: exchangeRate.exchange,
                quote: {
                    amount: unconfirmedStandardUnitQuoteCurrencyAmount.toString(),
                    currency: currencyPair.quote.code
                }
            };

            // incoming
            const incomingTransactionsSearchConditions = Object.assign({}, this.transactionService.getSearchConditions(TransactionSearchType.Unprocessed, {
                driverID: requestedDriver.id
            }));

            const incomingTransactions = await this.transactionService.searchTransactions(incomingTransactionsSearchConditions);

            const incomingStandardUnitQuoteCurrencyAmount = await incomingTransactions.reduce(async (result, transaction) => {
                const convertSettledValue = true;
                const includeCurrentValue = false;
                const transactionValue = await getTransactionValue(transaction, convertSettledValue, includeCurrentValue, currencyPair.quote, this.currencyManager, this.exchange);

                return (await result).add(transactionValue.settled.quote.amount);
            }, Promise.resolve(new Big(0)));

            const incomingStandardUnitBaseCurrencyConversionResult = await this.currencyManager.convertToStandardUnitBaseCurrencyAmount(incomingStandardUnitQuoteCurrencyAmount, currencyPair, this.exchange);

            const incomingValue: StandardCurrencyPairAmount = {
                base: {
                    amount: incomingStandardUnitBaseCurrencyConversionResult.amount.toString(),
                    currency: currencyPair.base.code
                },
                exchange: incomingStandardUnitBaseCurrencyConversionResult.exchangeRate.exchange,
                quote: {
                    amount: incomingStandardUnitQuoteCurrencyAmount.toString(),
                    currency: currencyPair.quote.code
                }
            };

            pendingValue = {
                unconfirmed: unconfirmedValue,
                incoming: incomingValue
            };
        }

        response.status(200).jsend.success({ balance: {
            settled: undefined,
            pending: pendingValue,
            current: currentValue
        } as OptionalSettledBlockchainValue<undefined> });
        next();
    }

    /**
     * POST /driver/:driverID/wallet/transfer
     * Transfer wallet funds
     */
    async transferDriverWalletFunds(request: Request, response: Response, next: NextFunction) {
        const requestedDriver = request.baseResource as IDriverDocument;

        if (!requestedDriver.walletID) {
            throw new Error(ErrorReason.WalletNotFound);
        }

        const storedWallet = await this.walletService.getWallet(requestedDriver.walletID);
        assert(storedWallet != undefined, AssertError.WalletExpected);

        const transferRequest = validateTransferFundsRequest(request.body, storedWallet.address, this.blockchainService, this.currencyManager);

        await this.walletService.transferFunds(storedWallet, transferRequest, this.currencyManager, this.exchange);

        response.status(200).jsend.success(null);
        next();
    }

    /**
     * GET /driver/:driverID/transactions
     * Search driver transactions
     */
    async searchDriverTransactions(request: Request, response: Response, next: NextFunction) {
        const query = validateSearchDriverTransactionsQuery(request.query);
        const requestedDriver = request.baseResource as IDriverDocument;

        if (!requestedDriver.walletID) {
            throw new Error(ErrorReason.WalletNotFound);
        }

        const wallet = await this.walletService.getWallet(requestedDriver.walletID);
        assert(wallet != undefined, AssertError.WalletExpected);

        const quoteCurrency = this.currencyManager.getCurrency(wallet.quoteCurrency);
        assert(quoteCurrency != undefined, AssertError.CurrencyExpected);

        const generalSearchConditions: any = {
            driverID: requestedDriver.id,
        };

        if (query.includePending == false) {
            generalSearchConditions.isPending = false;
        }

        const processedTransactionsSearchConditions = Object.assign({}, this.transactionService.getSearchConditions(TransactionSearchType.Processed, {
            networkID: wallet.networkID,
            receiverAddress: wallet.address
        }), generalSearchConditions);

        const incomingTransactionsSearchConditions = Object.assign({}, this.transactionService.getSearchConditions(TransactionSearchType.Unprocessed, {

        }), generalSearchConditions);

        const searchConditions = { $or: [processedTransactionsSearchConditions, incomingTransactionsSearchConditions] };

        const paginationResponse = await getJSendPartialResponse<"transactions", PublicTransaction>("transactions", request, async (limit, skip) => {
            const transactions = await this.transactionService.searchTransactions(searchConditions, limit, skip);
            const transactionCount = await this.transactionService.countTransactions(searchConditions);

            return {
                documents: await Promise.all(transactions.map(async (transaction: ITransactionDocument) => { 
                    const convertSettledValue = true;
                    const value = await getTransactionValue(transaction, convertSettledValue, query.showCurrentValue, quoteCurrency, this.currencyManager, this.exchange);
                
                    return transaction.toPublic(value.settled, value.current);
                })),
                totalDocumentsCount: transactionCount
            };
        });

        response.status(200).jsend.success(paginationResponse);
        next();
    }

}