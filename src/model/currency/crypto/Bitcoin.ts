import { CurrencyType, ICryptoCurrency } from "../../../interfaces/model/currency/Currency";

export class Bitcoin extends ICryptoCurrency {

    // MARK: - Public Properties
    readonly code = "BTC";

    readonly name = "Bitcoin";

    readonly symbol = "Ƀ";

    readonly decimalDigits = 8;

    readonly type = CurrencyType.Crypto;
    
    readonly baseUnit = {
        name: "Satoshi"
    }

}