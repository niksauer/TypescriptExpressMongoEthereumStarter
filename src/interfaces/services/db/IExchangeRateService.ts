import { IExtendedExchangeRate, IExtendedExchangeRateDocument } from "../../database/IExchangeRate";
import { ISimpleCurrencyPair } from "../../model/currency/ICurrencyPair";

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IExchangeRateService {
    createExchangeRate(proto: IExtendedExchangeRate): Promise<IExtendedExchangeRateDocument>;
    getExchangeRate(currencyPair: ISimpleCurrencyPair, date: Date): Promise<IExtendedExchangeRateDocument | undefined>;
    getNewestExchangeRate(currencyPair: ISimpleCurrencyPair): Promise<IExtendedExchangeRateDocument | undefined>;
}