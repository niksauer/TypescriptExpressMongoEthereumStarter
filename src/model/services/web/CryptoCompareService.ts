import axios, { AxiosInstance } from "axios";
import { ExchangeService } from "../../../interfaces/services/web/ExchangeService";
import { ErrorReason, Error } from "../../util/error/Error";
import { IExtendedExchangeRate } from "../../../interfaces/database/IExchangeRate";
import { ISimpleCurrencyPair } from "../../../interfaces/model/currency/ICurrencyPair";
import moment from "moment";

export class CryptoCompareService implements ExchangeService  {

    // MARK: - Private Properties
    private client: AxiosInstance;

    // MARK: - Initilization
    constructor() {
        this.client = axios.create({
            baseURL: "https://min-api.cryptocompare.com/data"
        });
    }    

    // MARK: - Public Methods
    async fetchCurrentExchangeRate(currencyPair: ISimpleCurrencyPair): Promise<IExtendedExchangeRate> {
        const response = await this.client.get("/price", { params: { 
            "fsym": currencyPair.base,
            "tsyms": currencyPair.quote
        }});

        const value = response.data[currencyPair.quote] as number;

        if (!value) {
            throw new Error(ErrorReason.InvalidCryptoCompareResponse);
        }

        return {
            exchange: {
                date: new Date(),
                rate: value
            },
            currencyPair: currencyPair
        };
    }    
    
    async fetchExchangeRateHistory(currencyPair: ISimpleCurrencyPair, since: Date): Promise<IExtendedExchangeRate[]> {
        const daysPassed = moment.utc(new Date()).diff(moment(since), "days") + 1;

        // if daysPassed issue and aggregate result of multi api calls with limit 2000

        const response = await this.client.get("/histoday", { params: {
            "fsym": currencyPair.base,
            "tsym": currencyPair.quote,
            "limit": daysPassed
        }});

        const history = response.data["Data"] as { time: number; close: number}[];

        if (!history) {
            throw new Error(ErrorReason.InvalidCryptoCompareResponse);
        }

        return history.map(day => {
            return { 
                exchange: {
                    date: moment.unix(day.time).toDate(), 
                    rate: day.close 
                },
                currencyPair: currencyPair
            };
        });
    }

}