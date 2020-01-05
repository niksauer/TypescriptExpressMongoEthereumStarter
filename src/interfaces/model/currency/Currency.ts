import { pickKeys } from "../../../model/util/helper";

export enum CurrencyType {
    Fiat = "fiat",
    Crypto = "crypto"
}

export const CURRENCY_TYPES: CurrencyType[] = [ 
    CurrencyType.Fiat, 
    CurrencyType.Crypto
];

export const VALID_CURRENCY_TYPES: CurrencyType[] = CURRENCY_TYPES;

export type CurrencyCode = Currency["code"];

export interface PublicCurrency {
    code: CurrencyCode;
    name: Currency["name"];
    symbol: Currency["symbol"];
    type: Currency["type"];
    decimalDigits: Currency["decimalDigits"];
    baseUnit: Currency["baseUnit"];
}

const PUBLIC_CURRENCY_KEYS: (keyof PublicCurrency)[] = [
    "code",
    "name",
    "symbol",
    "type",
    "decimalDigits",
    "baseUnit"
];

export interface BaseUnit {
    readonly name: string;
    readonly symbol?: string;
}

export abstract class Currency {
    abstract readonly code: string;
    abstract readonly name: string;
    abstract readonly symbol: string;
    abstract readonly type: CurrencyType;
    abstract readonly decimalDigits: number;

    abstract readonly baseUnit?: BaseUnit;

    toPublic(): PublicCurrency {
        return pickKeys<PublicCurrency>(this, PUBLIC_CURRENCY_KEYS);
    }
}

export abstract class IFiatCurrency extends Currency {
    readonly type = CurrencyType.Fiat;
}

export abstract class ICryptoCurrency extends Currency {
    readonly type = CurrencyType.Crypto;
}