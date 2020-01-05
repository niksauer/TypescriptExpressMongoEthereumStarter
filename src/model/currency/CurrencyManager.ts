import { FiatCurrency, FiatCurrencyCode } from "./FiatCurrency";
import { Bitcoin } from "./crypto/Bitcoin";
import { Currency, CurrencyType, CurrencyCode, ICryptoCurrency, IFiatCurrency } from "../../interfaces/model/currency/Currency";
import { ExtendedCurrencyPair } from "./CurrencyPair";
import { ICurrencyManager, CurrencyConversionResult } from "../../interfaces/model/currency/ICurrencyManager";
import Big, { RoundingMode } from "big.js";
import { Error, ErrorReason } from "../util/error/Error";
import { IExchange } from "../../interfaces/model/daemon/IExchange";
import { IExtendedExchangeRate } from "../../interfaces/database/IExchangeRate";
import { Ether } from "./crypto/Ether";
import { ERC20TokenCode, ERC20Token } from "./crypto/ERC20Token";

export const VALID_CRYPTO_CURRENCY_CODES = [
    "ETH"
];

export const VALID_FIAT_CURRENCY_CODES = [
    "EUR"
];

export const VALID_BASE_CURRENCY_CODES = VALID_CRYPTO_CURRENCY_CODES;

export const VALID_QUOTE_CURRENCY_CODES = VALID_FIAT_CURRENCY_CODES;

export class CurrencyManager implements ICurrencyManager {

    // MARK: - Public Methods
    getCurrency(code: CurrencyCode): Currency | undefined {
        const fiatCurrencyCode: FiatCurrencyCode | undefined = FiatCurrencyCode[code as keyof typeof FiatCurrencyCode];

        if (fiatCurrencyCode != undefined) {
            return new FiatCurrency(fiatCurrencyCode);
        }

        const erc20TokenCode: ERC20TokenCode | undefined = ERC20TokenCode[code as keyof typeof ERC20TokenCode];

        if (erc20TokenCode != undefined) {
            return new ERC20Token(erc20TokenCode);
        }

        switch (code) {
        case "BTC":
            return new Bitcoin();
        case "ETH":
            return new Ether();
        default:
            return undefined;
        }
    }

    getCurrencies(type: CurrencyType): Currency[] {
        switch (type) {
        case CurrencyType.Fiat:
            return VALID_FIAT_CURRENCY_CODES
                .map(fiatCurrencyCode => this.getCurrency(fiatCurrencyCode))
                .filter(currency => currency != undefined) as IFiatCurrency[];
        case CurrencyType.Crypto:
            return VALID_CRYPTO_CURRENCY_CODES
                .map(cryptoCurrencyCode => this.getCurrency(cryptoCurrencyCode))
                .filter(currency => currency != undefined) as ICryptoCurrency[];
        }
    }

    getCurrencyPairs(base: CurrencyType, quote: CurrencyType): ExtendedCurrencyPair[] {
        const baseCurrencies = this.getCurrencies(base);
        const quoteCurrencies = this.getCurrencies(quote);

        const currencyCombinations = baseCurrencies.map(baseCurrency => quoteCurrencies.map(quoteCurrency => new ExtendedCurrencyPair(baseCurrency, quoteCurrency)));
        const pairs = ([] as ExtendedCurrencyPair[]).concat(...currencyCombinations);
        
        pairs.filter((item, index) => pairs.indexOf(item) !== index);

        return pairs;
    }

    getCurrencyPair(base: CurrencyCode, quote: CurrencyCode): ExtendedCurrencyPair | undefined {
        const baseCurrency = this.getCurrency(base);
        const quoteCurrency = this.getCurrency(quote);

        if (!baseCurrency) {
            return undefined;
        }

        if (!quoteCurrency) {
            return undefined;
        }

        return new ExtendedCurrencyPair(baseCurrency, quoteCurrency);
    }

    async convertToStandardUnitBaseCurrencyAmount(standardUnitQuoteCurrencyAmount: Big, currencyPair: ExtendedCurrencyPair, exchange: IExchange, date?: Date): Promise<CurrencyConversionResult> {
        const exchangeRate = await this.getExchangeRate(currencyPair, exchange, date);        

        return {
            amount: standardUnitQuoteCurrencyAmount.div(new Big(exchangeRate.exchange.rate)).round(currencyPair.base.decimalDigits, RoundingMode.RoundHalfEven),
            exchangeRate: exchangeRate
        };
    }

    async convertToStandardUnitQuoteCurrencyAmount(standardUnitBaseCurrencyAmount: Big, currencyPair: ExtendedCurrencyPair, exchange: IExchange, date?: Date): Promise<CurrencyConversionResult> {
        const exchangeRate = await this.getExchangeRate(currencyPair, exchange, date);

        if (!exchangeRate) {
            throw new Error(ErrorReason.CurrencyConversionFailed);
        }

        return {
            amount: standardUnitBaseCurrencyAmount.mul(new Big(exchangeRate.exchange.rate)).round(currencyPair.quote.decimalDigits, RoundingMode.RoundHalfEven),
            exchangeRate: exchangeRate
        };
    }

    // https://github.com/ethereumjs/ethereumjs-units/blob/master/index.js
    // https://github.com/ethers-io/ethers.js/blob/061b0eae1d4c570aedd9bee1971afa43fcdae1a6/utils/units.js
    getStandardUnitCurrencyAmount(baseUnitAmount: Big, currency: Currency): Big {
        if (!currency.baseUnit) {
            return baseUnitAmount;
        }

        // return new Big(`${maxDigitsCurrencyAmount.toString()}e-${currency.maxDecimalDigits}`);
        // return maxDigitsCurrencyAmount.pow(-currency.maxDecimalDigits);
        
        return baseUnitAmount.div(new Big(`1e${currency.decimalDigits}`)).round(currency.decimalDigits, RoundingMode.RoundHalfEven);
    }
    
    getBaseUnitCurrencyAmount(standardUnitAmount: Big, currency: Currency): Big {
        if (!currency.baseUnit) {
            return standardUnitAmount;
        }

        // return new BigNumber(value, 10).mul(units[from]).round(0, BigNumber.ROUND_DOWN).div(units[to]).toString(10)
        // return new Big(`${standardDigitsCurrencyAmount.toString()}e${currency.maxDecimalDigits}`);    
        
        return standardUnitAmount.mul(new Big(`1e${currency.decimalDigits}`)).round(0, RoundingMode.RoundHalfEven);
    }

    // MARK: - Private Methods
    private async getExchangeRate(currencyPair: ExtendedCurrencyPair, exchange: IExchange, date?: Date): Promise<IExtendedExchangeRate> {
        let exchangeRate: IExtendedExchangeRate | undefined;

        if (date) {
            exchangeRate = await exchange.getExchangeRate(currencyPair.toSimple(), date);
        } else {
            exchangeRate = await exchange.getExchangeRate(currencyPair.toSimple());
        }
        
        if (!exchangeRate) {
            throw new Error(ErrorReason.CurrencyConversionFailed);
        }
        
        return exchangeRate;
    }
    
}