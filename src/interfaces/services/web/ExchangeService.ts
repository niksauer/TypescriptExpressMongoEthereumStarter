import { IExtendedExchangeRate } from "../../database/IExchangeRate";
import { ISimpleCurrencyPair } from "../../model/currency/ICurrencyPair";

export interface ExchangeService {
    fetchCurrentExchangeRate(currencyPair: ISimpleCurrencyPair): Promise<IExtendedExchangeRate>;
    fetchExchangeRateHistory(currencyPair: ISimpleCurrencyPair, since: Date): Promise<IExtendedExchangeRate[]>;
}