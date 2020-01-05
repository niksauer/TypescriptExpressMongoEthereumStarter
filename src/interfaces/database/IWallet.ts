import { pickKeys } from "../../model/util/helper";
import { PublicCurrency, CurrencyCode } from "../model/currency/Currency";
import { BlockchainNetworkID, BlockchainAddress } from "../model/Contract";
import { ICurrencyManager } from "../model/currency/ICurrencyManager";
import { AssertError, assert } from "../../model/util/error/AssertError";

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IWallet {
    id: string;
    isManaged: boolean;
    baseCurrency: CurrencyCode;
    quoteCurrency: CurrencyCode;
    networkID: BlockchainNetworkID;
    address: BlockchainAddress;
    hasCreatedManagedWallet: boolean;
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IWalletDocument extends IWallet {
    toPublic(currencyManager: ICurrencyManager): PublicWallet;
}

export interface PublicWallet {
    id: IWallet["id"];
    isManaged: IWallet["isManaged"];
    baseCurrency: PublicCurrency;
    quoteCurrency: PublicCurrency;
    networkID: IWallet["networkID"];
    address: IWallet["address"];
    hasCreatedManagedWallet: IWallet["hasCreatedManagedWallet"];
}

const PUBLIC_WALLET_KEYS: (keyof IWallet)[] = [
    "isManaged",
    "networkID",
    "address",
    "hasCreatedManagedWallet"
];

export function toPublicWallet(wallet: IWallet, currencyManager: ICurrencyManager): PublicWallet {
    const publicWallet = pickKeys<PublicWallet>(wallet, PUBLIC_WALLET_KEYS);
    
    const currencyPair = currencyManager.getCurrencyPair(wallet.baseCurrency, wallet.quoteCurrency);
    assert(currencyPair != undefined, AssertError.CurrencyPairExpected);

    publicWallet.baseCurrency = currencyPair.base.toPublic();
    publicWallet.quoteCurrency = currencyPair.quote.toPublic();

    return publicWallet;
}