import { Currency, CurrencyType, CurrencyCode } from "./Currency";
import Big from "big.js";
import { IExchange } from "../daemon/IExchange";
import { IExtendedExchangeRate } from "../../database/IExchangeRate";
import { IExtendedCurrencyPair } from "./ICurrencyPair";

export interface CurrencyConversionResult {
    amount: Big;
    exchangeRate: IExtendedExchangeRate;
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface ICurrencyManager {
    getCurrency(code: CurrencyCode): Currency | undefined;
    getCurrencies(type: CurrencyType): Currency[];
    getCurrencyPairs(base: CurrencyType, quote: CurrencyType): IExtendedCurrencyPair[];
    getCurrencyPair(base: CurrencyCode, quote: CurrencyCode): IExtendedCurrencyPair | undefined;
    convertToStandardUnitBaseCurrencyAmount(standardUnitQuoteCurrencyAmount: Big, currencyPair: IExtendedCurrencyPair, exchange: IExchange, date?: Date): Promise<CurrencyConversionResult>;
    convertToStandardUnitQuoteCurrencyAmount(standardUnitBaseCurrencyAmount: Big, currencyPair: IExtendedCurrencyPair, exchange: IExchange, date?: Date): Promise<CurrencyConversionResult>;
    getStandardUnitCurrencyAmount(baseUnitAmount: Big, currency: Currency): Big;
    getBaseUnitCurrencyAmount(standardUnitAmount: Big, currency: Currency): Big;
}