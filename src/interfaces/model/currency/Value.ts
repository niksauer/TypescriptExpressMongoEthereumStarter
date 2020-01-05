import { CurrencyCode } from "./Currency";
import { ISimpleExchangeRate } from "../../database/IExchangeRate";

export interface CurrencyAmount {
    amount: string;
    currency: CurrencyCode;
}

interface CurrencyPairAmount<Base extends CurrencyAmount | undefined, Exchange extends ISimpleExchangeRate | undefined, Quote extends CurrencyAmount | undefined> {
    base: Base;
    exchange: Exchange;
    quote: Quote;
}

export type StandardCurrencyPairAmount = CurrencyPairAmount<CurrencyAmount, ISimpleExchangeRate, CurrencyAmount>;
export type AggregatedCurrencyPairAmount = CurrencyPairAmount<CurrencyAmount, undefined, CurrencyAmount>;
export type OptionalBaseCurrencyPairAmount<Exchange extends ISimpleExchangeRate | undefined> = Exchange extends ISimpleExchangeRate ? StandardCurrencyPairAmount : CurrencyPairAmount<undefined, undefined, CurrencyAmount>;
// export type OptionalQuoteCurrencyPairAmount<Exchange extends ISimpleExchangeRate | undefined> = Exchange extends ISimpleExchangeRate ? StandardCurrencyPairAmount : CurrencyPairAmount<CurrencyAmount, undefined, undefined>;

interface TransactionValue<Settled extends OptionalBaseCurrencyPairAmount<ISimpleExchangeRate | undefined>, Current extends StandardCurrencyPairAmount | undefined> {
    settled: Settled;
    current: Current;
}

// export type StandardTransactionValue = TransactionValue<OptionalBaseCurrencyPairAmount<ISimpleExchangeRate>, StandardCurrencyPairAmount>;
export type OptionalSettledTransactionValue = TransactionValue<OptionalBaseCurrencyPairAmount<ISimpleExchangeRate | undefined>, undefined>;
export type OptionalCurrentTransactionValue = TransactionValue<OptionalBaseCurrencyPairAmount<ISimpleExchangeRate | undefined>, StandardCurrencyPairAmount | undefined>;

export interface PendingBlockchainValue {
    unconfirmed: StandardCurrencyPairAmount;
    incoming: StandardCurrencyPairAmount;
}

export interface BlockchainValue<Settled extends AggregatedCurrencyPairAmount | undefined, Pending extends PendingBlockchainValue | undefined, Current extends StandardCurrencyPairAmount | undefined> {
    settled: Settled;
    pending: Pending;
    current: Current;
}

export type StandardBlockchainValue = BlockchainValue<AggregatedCurrencyPairAmount, PendingBlockchainValue, StandardCurrencyPairAmount>;
export type OptionalSettledBlockchainValue<Settled extends AggregatedCurrencyPairAmount | undefined> = Settled extends AggregatedCurrencyPairAmount ? BlockchainValue<AggregatedCurrencyPairAmount, PendingBlockchainValue, StandardCurrencyPairAmount> : BlockchainValue<undefined, PendingBlockchainValue, StandardCurrencyPairAmount>;