import { AssertError, assert } from "../../util/error/AssertError";
import { EthereumCurrency } from "./Ether";

export enum ERC20TokenCode {
    REQ,
}

export const ERC20_TOKEN_CODES = [
    ERC20TokenCode.REQ,
];

export class ERC20Token extends EthereumCurrency {

    // MARK: - Private Properties
    private nameForTokenCode = new Map<ERC20TokenCode, string>([
        [ERC20TokenCode.REQ, "Request"],
    ]);

    private decimalDigitsForTokenCode = new Map<ERC20TokenCode, number>([
        [ERC20TokenCode.REQ, 18],
    ]);

    private contractAddressForTokenCode = new Map<ERC20TokenCode, string>([
        [ERC20TokenCode.REQ, ""],
    ]);

    private tokenCode: ERC20TokenCode;

    // MARK: - Public Properties
    get code(): string {
        return ERC20TokenCode[this.tokenCode];
    }  

    get name(): string {
        const name = this.nameForTokenCode.get(this.tokenCode);
        assert(name != undefined, AssertError.CryptoCurrencyNameExpected);
        return name;
    } 

    get symbol(): string {
        return this.code;
    }

    get decimalDigits(): number {
        const decimalDigits = this.decimalDigitsForTokenCode.get(this.tokenCode);
        assert(decimalDigits != undefined, AssertError.CryptoCurrencyDecimalDigitsExpected);
        return decimalDigits;
    }

    readonly baseUnit = undefined;

    get contractAddress(): string {
        const contractAddress = this.contractAddressForTokenCode.get(this.tokenCode);
        assert(contractAddress != undefined, AssertError.ERC20TokenContractAddressExpected);
        return contractAddress;
    }

    // MARK: - Initilization
    constructor(code: ERC20TokenCode) {
        super();
        this.tokenCode = code;
    }

}

