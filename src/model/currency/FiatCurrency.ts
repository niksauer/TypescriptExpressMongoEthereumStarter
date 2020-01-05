import { IFiatCurrency, BaseUnit } from "../../interfaces/model/currency/Currency";
import { assert, AssertError } from "../util/error/AssertError";

export enum FiatCurrencyCode {
    EUR,
    USD
}

export const FIAT_CURRENCY_CODES = [
    FiatCurrencyCode.EUR,
    FiatCurrencyCode.USD
];

export class FiatCurrency extends IFiatCurrency {
    
    // MARK: - Private Properties
    private nameForFiat = new Map<FiatCurrencyCode, string>([
        [FiatCurrencyCode.EUR, "Euro"],
        [FiatCurrencyCode.USD, "US Dollar"],
    ]);

    private symbolForFiat = new Map<FiatCurrencyCode, string>([
        [FiatCurrencyCode.EUR, "€"],
        [FiatCurrencyCode.USD, "$"],
    ]);
    
    // private baseUnitNameForFiat = new Map<Fiat, string>([
    //     [Fiat.EUR, "Cent"],
    //     [Fiat.USD, "Cent"],
    // ]);

    // private baseUnitSymbolForFiat = new Map<Fiat, string>([
    //     [Fiat.EUR, "¢"],
    //     [Fiat.USD, "¢"],
    // ]);

    private fiatCode: FiatCurrencyCode;

    // MARK: - Public Properties
    get code(): string {
        return FiatCurrencyCode[this.fiatCode];
    }  

    get name(): string {
        const name = this.nameForFiat.get(this.fiatCode);
        assert(name != undefined, AssertError.FiatCurrencyNameExpected);
        return name;
    } 

    get symbol(): string {
        const symbol = this.symbolForFiat.get(this.fiatCode);
        assert(symbol != undefined, AssertError.FiatCurrencySymbolExpected);
        return symbol;
    }
    
    get decimalDigits(): number {
        return 2;
    }

    get baseUnit(): BaseUnit {
        return {
            name: "Cent",
            symbol: "¢"
        };
    }

    // MARK: - Initilization
    constructor(code: FiatCurrencyCode) {
        super();
        this.fiatCode = code;
    }

}