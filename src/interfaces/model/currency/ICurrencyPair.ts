import { Currency, CurrencyCode } from "./Currency";

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface ISimpleCurrencyPair {
    base: CurrencyCode;
    quote: CurrencyCode;
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IExtendedCurrencyPair {
    base: Currency;
    quote: Currency;
    toSimple(): ISimpleCurrencyPair;
}

export function getCurrencyPairName(currencyPair: ISimpleCurrencyPair | IExtendedCurrencyPair): string {
    if (typeof currencyPair.base == "string") {
        const simpleCurrencyPair = currencyPair as ISimpleCurrencyPair;
        return `${simpleCurrencyPair.base}${simpleCurrencyPair.quote}`;
    } else {
        const extendedCurrencyPair = currencyPair as IExtendedCurrencyPair;
        return `${extendedCurrencyPair.base.code}${extendedCurrencyPair.quote.code}`;
    }
    
}