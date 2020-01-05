import { ISimpleCurrencyPair } from "../model/currency/ICurrencyPair";

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface ISimpleExchangeRate {
    date: Date;
    rate: number;
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IExtendedExchangeRate {
    exchange: ISimpleExchangeRate;
    currencyPair: ISimpleCurrencyPair;
}


// eslint-disable-next-line
export interface IExtendedExchangeRateDocument extends IExtendedExchangeRate {
}