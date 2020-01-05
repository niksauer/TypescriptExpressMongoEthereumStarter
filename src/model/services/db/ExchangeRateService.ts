import { IExchangeRateService } from "../../../interfaces/services/db/IExchangeRateService";
import { IExtendedExchangeRate, IExtendedExchangeRateDocument } from "../../../interfaces/database/IExchangeRate";
import { ExchangeRate, ExchangeRateDocument, ExchangeRateDocumentPrototype } from "../../database/ExchangeRate";
import Moment from "moment";
import { ISimpleCurrencyPair } from "../../../interfaces/model/currency/ICurrencyPair";

export class ExchangeRateService implements IExchangeRateService {

    // MARK: - Private Properties
    
    // MARK: - Initialization

    // MARK: - Public Methods
    async createExchangeRate(proto: IExtendedExchangeRate): Promise<ExchangeRateDocument> {
        const exchangeRate = new ExchangeRate({
            exchange: proto.exchange,
            currencyPair: proto.currencyPair
        } as ExchangeRateDocumentPrototype);

        return await exchangeRate.save();
    }

    async getExchangeRate(currencyPair: ISimpleCurrencyPair, date: Date): Promise<IExtendedExchangeRateDocument | undefined> {
        const searchConditions = { "exchange.date": Moment(Moment.utc(date).startOf("day").toDate() ), currencyPair: currencyPair };
        const exchangeRate = await ExchangeRate.findOne(searchConditions);

        if (!exchangeRate) {
            return undefined;
        }

        return exchangeRate;
    }

    async getNewestExchangeRate(currencyPair: ISimpleCurrencyPair): Promise<IExtendedExchangeRateDocument | undefined> {
        const exchangeRate = await ExchangeRate.findOne({ currencyPair: currencyPair }).sort({ date: "desc" }).limit(1).exec();

        if (!exchangeRate) {
            return undefined;
        }

        return exchangeRate;
    }

}