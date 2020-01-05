import { pickKeys } from "../../model/util/helper";
import { Currency } from "../model/currency/Currency";
import { ICurrencyManager } from "../model/currency/ICurrencyManager";
import { IExchange } from "../model/daemon/IExchange";
import Big from "big.js";
import { Error, ErrorReason } from "../../model/util/error/Error";
import { OptionalSettledTransactionValue, OptionalCurrentTransactionValue, StandardCurrencyPairAmount, OptionalBaseCurrencyPairAmount } from "../model/currency/Value";
import { ISimpleExchangeRate } from "./IExchangeRate";
import { ContractInteraction, ContractInteractionType, ContractInfo } from "../model/Contract";
import { BlockchainAddress } from "../model/Contract";
import { IDriver } from "./IDriver";

export enum DataPointUnit {
    Volume = "vol",
    Time = "time"
}

export const DATA_POINT_UNITS: DataPointUnit[] = [
    DataPointUnit.Volume,
    DataPointUnit.Time,
];

export const VALID_DATA_POINT_UNITS: DataPointUnit[] = [
    DataPointUnit.Time
];

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface ITransactionPrototype {
    driverID: ITransaction["driverID"];
    date: ITransaction["date"];
    value: ITransaction["value"];
    contractInteraction?: ITransaction["contractInteraction"];
    receiverAddress?: ITransaction["receiverAddress"];
    isPending: ITransaction["isPending"];
    // refs
}

export interface TransactionContractInteraction {
    contract: ContractInfo;
    // payDriver: ContractInteraction<ContractInteractionType.PayDriver>;
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface ITransaction {
    id: string;
    driverID: IDriver["id"];
    date: Date;
    value: OptionalSettledTransactionValue;
    contractInteraction?: TransactionContractInteraction;
    receiverAddress?: BlockchainAddress;
    isPending: boolean;
    // refs
    // document
    createdAt: Date;
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface ITransactionDocument extends ITransaction {
    toPublic(settledValue: ITransaction["value"]["settled"], currentValue?: PublicTransaction["value"]["current"]): PublicTransaction;
}

export interface PublicTransaction {
    id: ITransaction["id"];
    // input
    driverID: ITransaction["driverID"];
    date: ITransaction["date"];

    // enhanced
    value: OptionalCurrentTransactionValue;
    contractInteraction?: ITransaction["contractInteraction"];
    isPending: ITransaction["isPending"];
}

const PUBLIC_TRANSACTION_KEYS: (keyof ITransaction)[] = [
    "id",
    "driverID",
    "date",
    
    // enhanced
    "value",
    "contractInteraction",
    "isPending",
];

export function toPublicTransaction(transaction: ITransaction, settledValue: PublicTransaction["value"]["settled"], currentValue?: PublicTransaction["value"]["current"]): PublicTransaction {
    const publicTransaction = pickKeys<PublicTransaction>(transaction, PUBLIC_TRANSACTION_KEYS);

    if (settledValue) {
        publicTransaction.value.settled = settledValue;
    }

    publicTransaction.value.current = currentValue;
    
    return publicTransaction;
}

export async function getTransactionValue(transaction: ITransaction, convertSettledValue: boolean, includeCurrentValue: boolean, quoteCurrency: Currency, currencyManager: ICurrencyManager, exchange: IExchange): Promise<OptionalCurrentTransactionValue> {
    const oldSettledValue = pickKeys<OptionalBaseCurrencyPairAmount<ISimpleExchangeRate | undefined>>(Object.assign({}, transaction.value.settled), ["base", "exchange", "quote"]);

    // $isEmpty() check is required because mongoose returns undefined nested object properties as empty objects
    // however, setting this fields as undefined after loading document from db would also return special MongooseDocument { undefined } object again not equaling undefined

    if ((oldSettledValue.base as any).$isEmpty()) {
        oldSettledValue.base = undefined;
    }

    if ((oldSettledValue.exchange as any).$isEmpty()) {
        oldSettledValue.exchange = undefined;
    }

    let newSettledValue: OptionalBaseCurrencyPairAmount<ISimpleExchangeRate | undefined>;
    
    if (convertSettledValue && oldSettledValue.quote.currency != quoteCurrency.code) {
        throw new Error(ErrorReason.NotImplemented);
        
        // do conversion from old quote currency to specified quote currency (using todays rate)
        // if transaction.contractInteraction != undefined > calculate exchange rate for new quote currency <> base currency
    } else {
        newSettledValue = oldSettledValue;
    }
    
    if (transaction.isPending === true || !includeCurrentValue) {
        return {
            settled: newSettledValue,
            current: undefined,
        };
    }

    const settledBaseAmount = oldSettledValue.base;

    if (!settledBaseAmount) {
        return {
            settled: newSettledValue,
            current: undefined,
        };
    }

    const currencyPair = currencyManager.getCurrencyPair(settledBaseAmount.currency, quoteCurrency.code);

    if (!currencyPair) {
        return {
            settled: newSettledValue,
            current: undefined,
        };
    }

    const standardUnitQuoteCurrencyAmountConversionResult = await currencyManager.convertToStandardUnitQuoteCurrencyAmount(new Big(settledBaseAmount.amount), currencyPair, exchange);

    const currentValue: StandardCurrencyPairAmount = {
        base: settledBaseAmount,
        exchange: standardUnitQuoteCurrencyAmountConversionResult.exchangeRate.exchange,
        quote: {
            amount: standardUnitQuoteCurrencyAmountConversionResult.amount.toString(),
            currency: currencyPair.quote.code
        }
    };
    
    return {
        settled: newSettledValue,
        current: currentValue,
    };
}