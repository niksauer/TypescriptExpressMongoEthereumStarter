import { CreateOrUpdateWalletRequest } from "../../request/driver/CreateOrUpdateWalletRequest";
import { TransferFundsRequest } from "../../request/driver/TransferFundsRequest";
import { IWallet, IWalletDocument } from "../../database/IWallet";
import { IDriver } from "../../database/IDriver";
import { IExchange } from "../../model/daemon/IExchange";
import { ICurrencyManager } from "../../model/currency/ICurrencyManager";

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IWalletService {
    createOrUpdateWallet(request: CreateOrUpdateWalletRequest, user: IDriver): Promise<{ created: boolean; wallet: IWalletDocument }>;
    getWallet(id: IWallet["id"]): Promise<IWalletDocument | undefined>;
    deleteWallet(wallet: IWallet): Promise<void>;
    transferFunds(wallet: IWalletDocument, request: TransferFundsRequest, currencyManager: ICurrencyManager, exchange: IExchange): Promise<void>;
}

