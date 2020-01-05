import { Currency } from "../../interfaces/model/currency/Currency";
import { ISimpleCurrencyPair, IExtendedCurrencyPair } from "../../interfaces/model/currency/ICurrencyPair";

export class ExtendedCurrencyPair implements IExtendedCurrencyPair {

    // MARK: - Public Properties
    base: Currency;
    quote: Currency;

    get name(): string {
        return `${this.base.code}${this.quote.code}`;
    }

    // MARK: - Initialization
    constructor(base: Currency, quote: Currency) {
        this.base = base;
        this.quote = quote;
    }
    
    // MARK: - Public Methods
    toSimple(): ISimpleCurrencyPair {
        return {
            base: this.base.code,
            quote: this.quote.code
        };
    }

}