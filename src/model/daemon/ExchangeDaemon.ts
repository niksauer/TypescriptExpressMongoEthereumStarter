import { ExchangeService } from "../../interfaces/services/web/ExchangeService";
import { IExchangeRateService } from "../../interfaces/services/db/IExchangeRateService";
import { singleton, inject } from "tsyringe";
import { Dependency } from "../../make";
import { ILogger } from "../../interfaces/model/ILogger";
import { IExchangeDaemon } from "../../interfaces/model/daemon/IExchange";
import { IExtendedExchangeRate } from "../../interfaces/database/IExchangeRate";
import moment from "moment";
import { IExtendedCurrencyPair, ISimpleCurrencyPair, getCurrencyPairName } from "../../interfaces/model/currency/ICurrencyPair";
import { assert, AssertError } from "../util/error/AssertError";

@singleton()
export class ExchangeDaemon implements IExchangeDaemon {

    // MARK: - Public Properties
    readonly updateInterval: number;

    get isRunning(): boolean {
        return this._isRunning;
    }

    // MARK: - Private Properties
    private exchangeService: ExchangeService;
    private exchangeRateService: IExchangeRateService;
    private logger: ILogger;

    private updateTimer: NodeJS.Timeout | undefined;
    private currencyPairs: Set<IExtendedCurrencyPair> = new Set();
    private exchangeRateForCurrencyPair = new Map<string, IExtendedExchangeRate>();

    private _isRunning = false;

    // MARK: - Initialization
    constructor(
        @inject(Dependency.ExchangeRateUpdateInterval) updateInterval: number,
        @inject(Dependency.ExchangeService) exchangeService: ExchangeService, 
        @inject(Dependency.ExchangeRateService) exchangeRateService: IExchangeRateService,
        @inject(Dependency.Logger) logger: ILogger
    ) {
        this.updateInterval = updateInterval * 1000;
        this.exchangeService = exchangeService;
        this.exchangeRateService = exchangeRateService;
        this.logger = logger;
    }

    // MARK: - Public Methods
    async start(): Promise<void> {
        this.startUpdateTimer();
        
        this._isRunning = true;
    }  

    async stop(): Promise<void> {
        this.stopUpdateTimer();

        this._isRunning = false;
    }

    addCurrencyPair(currencyPair: IExtendedCurrencyPair) {        
        if (this.currencyPairs.has(currencyPair)) {
            return;
        }

        this.currencyPairs.add(currencyPair);
        this.updateExchangeRate(currencyPair);
        this.logger.debug(`Added currency pair ${getCurrencyPairName(currencyPair)} to ExchangeDaemon`);

        if (this.currencyPairs.size > 0 && this.isRunning) {
            this.startUpdateTimer();
        }
    }

    removeCurrencyPair(currencyPair: IExtendedCurrencyPair) {
        if (!this.isRunning) {
            return;
        }

        if (!this.currencyPairs.has(currencyPair)) {
            return;
        }

        this.currencyPairs.delete(currencyPair);
        this.logger.debug(`Removed currency pair ${getCurrencyPairName(currencyPair)} from ExchangeDaemon`);

        if (this.currencyPairs.size == 0) {
            this.stopUpdateTimer();
        }
    }
    
    async getExchangeRate(currencyPair: ISimpleCurrencyPair, date?: Date): Promise<IExtendedExchangeRate | undefined> {
        if (!date || moment(date).isSame(new Date(), "day")) {
            return this.exchangeRateForCurrencyPair.get(`${currencyPair.base}${currencyPair.quote}`);
        } else {            
            const exchangeRate = await this.exchangeRateService.getExchangeRate(currencyPair, date);

            if (exchangeRate) {
                return exchangeRate;
            }

            await this.updateExchangeRateHistory(currencyPair, date);

            return this.exchangeRateService.getExchangeRate(currencyPair, date);
        }
    }

    async update() {
        for (const currencyPair of this.currencyPairs) {
            await this.updateExchangeRate(currencyPair);
        }
    }

    reset() {
        this.stopUpdateTimer();
        this.currencyPairs = new Set();
        this.logger.debug("Reset ExchangeDaemon");
    }

    // MARK: - Private Methods
    private startUpdateTimer() {
        if (this.currencyPairs.size == 0) {
            return;
        }

        if (this.updateTimer) {
            return;
        }

        this.updateTimer = setInterval(this.update.bind(this), this.updateInterval);
        this.logger.debug(`Started timer for ExchangeDaemon with ${this.updateInterval / 1000} second interval`);
    }

    private stopUpdateTimer() {
        if (!this.updateTimer) {
            return;
        }

        clearInterval(this.updateTimer);
        this.updateTimer = undefined;
        this.logger.debug("Stopped timer for ExchangeDaemon");
    }

    private async updateExchangeRate(currencyPair: IExtendedCurrencyPair): Promise<void> {
        try {
            const exchangeRate = await this.exchangeService.fetchCurrentExchangeRate(currencyPair.toSimple());
            this.exchangeRateForCurrencyPair.set(getCurrencyPairName(currencyPair), exchangeRate);
            this.logger.debug(`Updated exchange rate for currency pair ${getCurrencyPairName(currencyPair)}: ${exchangeRate.exchange.rate}`);
        } catch (error) {
            this.logger.error(`Failed to update exchange rate for currency pair ${getCurrencyPairName(currencyPair)}`, error);
        }
    }

    private async updateExchangeRateHistory(currencyPair: ISimpleCurrencyPair, since: Date): Promise<void> {        
        let startDate: Date;

        if ((await this.exchangeRateService.getExchangeRate(currencyPair, since)) != undefined) {
            const newestExchangeRate = await this.exchangeRateService.getNewestExchangeRate(currencyPair);

            assert(newestExchangeRate != undefined, AssertError.StoredExchangeRateExpected);

            startDate = moment(newestExchangeRate.exchange.date).startOf().add(1, "day").toDate();
        } else {
            startDate = moment(moment.utc(since)).startOf("day").toDate();
        }

        if (moment(startDate).isSameOrAfter(new Date(), "day")) {
            return;
        }

        const exchangeRates = await this.exchangeService.fetchExchangeRateHistory(currencyPair, since);

        for (const exchangeRate of exchangeRates) {
            if (moment(exchangeRate.exchange.date).isSame(new Date(), "day")) {
                // leave out result for today
                continue;
            }

            try {
                await this.exchangeRateService.createExchangeRate(exchangeRate);
            } catch (error) {
                // catch duplicate errors
                throw error;
            }
        }
    }

}