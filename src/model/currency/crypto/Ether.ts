import { ICryptoCurrency } from "../../../interfaces/model/currency/Currency";

export abstract class EthereumCurrency extends ICryptoCurrency {
}

export class Ether extends EthereumCurrency {

    // MARK: - Public Properties
    readonly code = "ETH";

    readonly name = "Ether";

    readonly symbol = "Ξ";

    readonly decimalDigits = 18;
    
    readonly baseUnit = {
        name: "Wei"
    }

}