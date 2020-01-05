import { IDaemon } from "./IDaemon";
import { IExtendedExchangeRate } from "../../database/IExchangeRate";
import { IExtendedCurrencyPair, ISimpleCurrencyPair } from "../currency/ICurrencyPair";

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IExchange {
    getExchangeRate(currencyPair: ISimpleCurrencyPair): Promise<IExtendedExchangeRate | undefined>;
    getExchangeRate(currencyPair: ISimpleCurrencyPair, date: Date): Promise<IExtendedExchangeRate | undefined>;
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IExchangeDaemon extends IExchange, IDaemon {
    readonly updateInterval: number;
    addCurrencyPair(currencyPair: IExtendedCurrencyPair): void;
    removeCurrencyPair(currencyPair: IExtendedCurrencyPair): void;
    update(): Promise<void>;
    reset(): void;
}