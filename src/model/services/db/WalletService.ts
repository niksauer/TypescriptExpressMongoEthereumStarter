import { IWalletService } from "../../../interfaces/services/db/IWalletService";
import { BlockchainService, BlockchainTransactionRequest } from "../../../interfaces/services/blockchain/BlockchainService";
import { Wallet, WalletDocument, WalletDocumentPrototype } from "../../database/Wallet";
import { ValidationError, ValidationErrorReason } from "../../util/error/ValidationError";
import { Error, ErrorReason } from "../../util/error/Error";
import { CreateOrUpdateWalletRequest } from "../../../interfaces/request/driver/CreateOrUpdateWalletRequest";
import { TransferFundsRequest } from "../../../interfaces/request/driver/TransferFundsRequest";
import { injectable, inject } from "tsyringe";
import { Dependency } from "../../../make";
import { IDriverService } from "../../../interfaces/services/db/IUserService";
import { DriverDocument } from "../../database/User";
import Big from "big.js";
import { IExchange } from "../../../interfaces/model/daemon/IExchange";
import { assert, AssertError } from "../../util/error/AssertError";
import { ILogger } from "../../../interfaces/model/ILogger";
import { BlockchainWallet } from "../../../interfaces/services/blockchain/BlockchainWallet";
import { CurrencyCode } from "../../../interfaces/model/currency/Currency";
import { ICurrencyManager } from "../../../interfaces/model/currency/ICurrencyManager";

@injectable()
export class WalletService implements IWalletService {
    
    // MARK: - Private Properties
    private blockchainService: BlockchainService;
    private driverService: IDriverService;
    private logger: ILogger;
    private walletBaseCurrency: CurrencyCode;

    // MARK: - Initialization
    constructor(
        @inject(Dependency.BlockchainService) blockchainService: BlockchainService, 
        @inject(Dependency.UserService) userService: IDriverService,
        @inject(Dependency.Logger) logger: ILogger,
        @inject(Dependency.WalletBaseCurrency) walletBaseCurrency: CurrencyCode,
    ) {
        this.blockchainService = blockchainService;
        this.driverService = userService;
        this.logger = logger;
        this.walletBaseCurrency = walletBaseCurrency;
    }
    
    // MARK: - Public Methods
    async createOrUpdateWallet(request: CreateOrUpdateWalletRequest, driver: DriverDocument): Promise<{ created: boolean; wallet: WalletDocument }> {
        // helper methods
        const saveAndReturnWallet = async (wallet: WalletDocument, updateUserLink: boolean): Promise<{ created: boolean; wallet: WalletDocument }> => {
            await wallet.save();

            if (!updateUserLink) {
                return { created: false, wallet: wallet };
            }

            driver.walletID = wallet.id;
            await this.driverService.saveDriver(driver);

            return { created: true, wallet: wallet };
        };

        const linkToNewManagedWallet = async (storedWallet: WalletDocument, updateUserLink: boolean): Promise<{ created: boolean; wallet: WalletDocument }> => {
            if (!request.password) {
                throw new ValidationError([{
                    key: "password",
                    reason: ValidationErrorReason.PasswordRequired 
                }]);
            }

            // poddibly validate password

            const wallet = this.blockchainService.createWallet();
            const encryptedWallet = await wallet.encrypt(request.password);
            
            storedWallet.managedAddress = wallet.address;
            storedWallet.managedEncryptedWallet = encryptedWallet;
            storedWallet.isManaged = true;

            return saveAndReturnWallet(storedWallet, updateUserLink);
        };

        const linkToExternalWallet = async (wallet: WalletDocument, address: string, updateUserLink: boolean): Promise<{ created: boolean; wallet: WalletDocument }> => {
            const existingWallet = await Wallet.findOne({ $or: [{ managedAddress: request.address }, { externalAddress: request.address }], _id: { $ne: wallet.id } });

            if (existingWallet) {
                throw new Error(ErrorReason.AddressOccupied);
            }

            wallet.externalAddress = address;
            wallet.isManaged = false;

            return saveAndReturnWallet(wallet, updateUserLink);
        };
 
        if (!driver.walletID) {
            // create new wallet
            const wallet = new Wallet({
                baseCurrency: this.walletBaseCurrency,
                quoteCurrency: request.quoteCurrency,
                networkID: this.blockchainService.networkID,
            } as WalletDocumentPrototype);

            if (request.address) {
                // link to address if not occupied by different driver
                return linkToExternalWallet(wallet, request.address, true);
            } else {
                // create new managed wallet
                return linkToNewManagedWallet(wallet, true);
            }
        } else {
            // update existing wallet
            const existingWallet = await Wallet.findById(driver.walletID);
            assert(existingWallet != undefined, AssertError.WalletExpected);

            existingWallet.quoteCurrency = request.quoteCurrency;

            if (request.address) {
                // update link if different than previous externalAddress and not occupied by different driver              
                return linkToExternalWallet(existingWallet, request.address, false);
            } else {
                // revert to previous managed wallet or create new managed wallet if not existent
                if (existingWallet.hasCreatedManagedWallet) {
                    existingWallet.isManaged = true;
                    return await saveAndReturnWallet(existingWallet, false);
                }

                return linkToNewManagedWallet(existingWallet, false);
            }
        }
    }

    async getWallet(id: WalletDocument["_id"]): Promise<WalletDocument | undefined> {
        const wallet = await Wallet.findById(id);  

        if (wallet == null) {
            return undefined;
        }

        return wallet;
    }

    async deleteWallet(wallet: WalletDocument): Promise<void> {
        await wallet.remove();
    }

    async transferFunds(wallet: WalletDocument, request: TransferFundsRequest, currencyManager: ICurrencyManager, exchange: IExchange): Promise<void> {
        if (!wallet.isManaged) {
            throw new Error(ErrorReason.ExternalWalletTransfer);
        }

        assert(wallet.managedEncryptedWallet != undefined, AssertError.ManagedWalletExpected);

        const currencyPair = currencyManager.getCurrencyPair(wallet.baseCurrency, wallet.quoteCurrency);
        assert(currencyPair != undefined, AssertError.CurrencyPairExpected);

        let standardUnitBaseCurrencyAmount: Big;

        if (request.currency != wallet.baseCurrency) {
            standardUnitBaseCurrencyAmount = (await currencyManager.convertToStandardUnitBaseCurrencyAmount(request.amount, currencyPair, exchange)).amount;
        } else {
            standardUnitBaseCurrencyAmount = request.amount; // standard unit amount
        }

        const baseUnitBaseCurrencyAmount = currencyManager.getBaseUnitCurrencyAmount(standardUnitBaseCurrencyAmount, currencyPair.base);

        const transactionRequest: BlockchainTransactionRequest = {
            to: request.receiverAddress,
            value: baseUnitBaseCurrencyAmount
        };

        const hasEnoughBalance = await this.blockchainService.hasEnoughBalance(transactionRequest, wallet.address);

        if (!hasEnoughBalance) {
            throw new Error(ErrorReason.InsufficientBalance);
        }

        let managedWallet: BlockchainWallet;

        try {
            managedWallet = await this.blockchainService.unlockWallet(wallet.managedEncryptedWallet, request.password);
        } catch (error) {
            this.logger.error(error);
            throw new Error(ErrorReason.WalletDecryptionFailed);
        }

        const transaction = await this.blockchainService.createTransaction(transactionRequest, wallet.address);
        const signedTransaction = await managedWallet.signTransaction(transaction);

        await this.blockchainService.sendSignedTransaction(signedTransaction);
    }
}