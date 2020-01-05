import { setupTestEnvironment } from "./util/setup";
import request from "supertest";
import { Application } from "express";
import { getJSendSuccessResponse, JSendErrorResponse, JSendResponseStatus, JSendFailResponse } from "../src/model/util/response/JSendResponse";
import { PublicWallet } from "../src/interfaces/database/IWallet";
import { CreateOrUpdateWalletRequest } from "../src/interfaces/request/driver/CreateOrUpdateWalletRequest";
import { FiatCurrency, FiatCurrencyCode } from "../src/model/currency/FiatCurrency";
import { ValidationError, ValidationErrorReason } from "../src/model/util/error/ValidationError";
import { ErrorReason } from "../src/model/util/error/Error";
import { Currency } from "../src/interfaces/model/currency/Currency";
import { OptionalSettledBlockchainValue } from "../src/interfaces/model/currency/Value";

// MARK: - Helper Methods
interface ExpectedWallet {
    isManaged: PublicWallet["isManaged"];
    address?: PublicWallet["address"];
    hasCreatedManagedWallet: PublicWallet["hasCreatedManagedWallet"];
    baseCurrency: Currency;
    quoteCurrency: Currency;
}

function validateWallet(wallet: PublicWallet, expected: ExpectedWallet): void {
    expect(wallet.isManaged).toEqual(expected.isManaged);        
    
    if (expected.address) {
        expect(wallet.address).toEqual(expected.address);
    } else {
        expect(wallet.address).toEqual(expect.any(String));
    }
    
    expect(wallet.hasCreatedManagedWallet).toEqual(expected.hasCreatedManagedWallet); 

    const baseCurrency = expected.baseCurrency;

    expect(wallet.baseCurrency.code).toEqual(baseCurrency.code);
    expect(wallet.baseCurrency.decimalDigits).toEqual(baseCurrency.decimalDigits);
    expect(wallet.baseCurrency.name).toEqual(baseCurrency.name);
    expect(wallet.baseCurrency.symbol).toEqual(baseCurrency.symbol);
    expect(wallet.baseCurrency.type).toEqual(baseCurrency.type);

    if (baseCurrency.baseUnit) {
        expect(wallet.baseCurrency.baseUnit).toBeDefined();

        if (wallet.baseCurrency.baseUnit) {
            expect(wallet.baseCurrency.baseUnit.name).toEqual(baseCurrency.baseUnit.name);

            if (baseCurrency.baseUnit.symbol) {
                expect(wallet.baseCurrency.baseUnit.symbol).toBeDefined();

                if (wallet.baseCurrency.baseUnit.symbol) {
                    expect(wallet.baseCurrency.baseUnit.symbol).toEqual(baseCurrency.baseUnit.symbol);
                }
            }
        }    
    }

    const quoteCurrency = expected.quoteCurrency;

    expect(wallet.quoteCurrency.code).toEqual(quoteCurrency.code);
    expect(wallet.quoteCurrency.decimalDigits).toEqual(quoteCurrency.decimalDigits);
    expect(wallet.quoteCurrency.name).toEqual(quoteCurrency.name);
    expect(wallet.quoteCurrency.symbol).toEqual(quoteCurrency.symbol);
    expect(wallet.quoteCurrency.type).toEqual(quoteCurrency.type);

    if (quoteCurrency.baseUnit) {
        expect(wallet.quoteCurrency.baseUnit).toBeDefined();

        if (wallet.quoteCurrency.baseUnit) {
            expect(wallet.quoteCurrency.baseUnit.name).toEqual(quoteCurrency.baseUnit.name);

            if (quoteCurrency.baseUnit.symbol) {
                expect(wallet.quoteCurrency.baseUnit.symbol).toBeDefined();

                if (wallet.quoteCurrency.baseUnit.symbol) {
                    expect(wallet.quoteCurrency.baseUnit.symbol).toEqual(quoteCurrency.baseUnit.symbol);
                }
            }
        }    
    }
}

// MARK: - Test Suite
describe("test /driver/wallet", () => {

    // MARK: - Data
    let app: Application;
    let basePath: string;
    let baseCurrency: Currency;

    const driverAuthToken = "";
    const driverID = "abc12345678";
    
    const quoteCurrency = new FiatCurrency(FiatCurrencyCode.EUR);

    const createWalletRequest: CreateOrUpdateWalletRequest = {
        quoteCurrency: quoteCurrency.code,
    };

    const walletPassword = "hello";

    // MARK: - Hooks
    beforeAll(async () => {
        const environment = await setupTestEnvironment({ 
            database: {
                reset: true,
                entities: {
                    all: false
                }
            },
            blockchain: {
                funding: {
                    drivers: false
                }
            }
        });
        
        app = environment.expressApp;
        basePath = `${environment.app.basePath}/driver`;
        baseCurrency = environment.blockchainCurrency;

        const response = await request(app)
            .post(basePath)
            .set({ 
                "Authorization": `Bearer ${driverAuthToken}` 
        });

        expect(response.status).toEqual(201);
    });

    // MARK: - Tests
    it("creates wallet, should return 400 - Bad Request", async (done) => {
        const response = await request(app)
            .put(`${basePath}/${driverID}/wallet`)
            .set({
                "Authorization": `Bearer ${driverAuthToken}`
            })
            .send(createWalletRequest);
        
        expect(response.status).toEqual(400);

        const walletResponse: JSendFailResponse = response.body;

        expect(walletResponse.status).toEqual(JSendResponseStatus.Fail);
        expect(walletResponse.data.password).toEqual(ValidationError.messageForReason.get(ValidationErrorReason.PasswordRequired));
        
        done();
    });

    it("creates wallet, should return 201 - Created", async (done) => {
        createWalletRequest.password = walletPassword;
        
        const response = await request(app)
            .put(`${basePath}/${driverID}/wallet`)
            .set({
                "Authorization": `Bearer ${driverAuthToken}`
            })
            .send(createWalletRequest);
        
        expect(response.status).toEqual(201);

        const walletResponse = getJSendSuccessResponse<"wallet", PublicWallet>(response.body);
        const wallet = walletResponse.data.wallet;

        expect(walletResponse.status).toEqual(JSendResponseStatus.Success);

        validateWallet(wallet, {
            isManaged: true,
            hasCreatedManagedWallet: true,
            baseCurrency: baseCurrency,
            quoteCurrency: quoteCurrency,
        });
        
        done();
    });

    it("gets wallet by driver id, should return 200 - OK", async (done) => {
        const response = await request(app)
            .get(`${basePath}/${driverID}/wallet`)
            .set({
                "Authorization": `Bearer ${driverAuthToken}`
            });

        expect(response.status).toEqual(200);

        const walletResponse = getJSendSuccessResponse<"wallet", PublicWallet>(response.body);
        const wallet = walletResponse.data.wallet;

        expect(walletResponse.status).toEqual(JSendResponseStatus.Success);

        validateWallet(wallet, {
            isManaged: true,
            hasCreatedManagedWallet: true,
            baseCurrency: baseCurrency,
            quoteCurrency: quoteCurrency,
        });

        done(); 
    }); 
    
    it("gets wallet balance by driver id, should return 200 - OK", async (done) => {
        const response = await request(app)
            .get(`${basePath}/${driverID}/wallet/balance`)
            .set({
                "Authorization": `Bearer ${driverAuthToken}`
            });

        expect(response.status).toEqual(200);

        const walletResponse = getJSendSuccessResponse<"balance", OptionalSettledBlockchainValue<undefined>>(response.body);
        const balance = walletResponse.data.balance;

        expect(walletResponse.status).toEqual(JSendResponseStatus.Success);

        expect(balance.current.base.amount).toEqual(expect.any(String));
        expect(balance.current.base.currency).toEqual(baseCurrency.code);
        expect(new Date(balance.current.exchange.date)).toEqual(expect.any(Date));
        expect(balance.current.exchange.rate).toEqual(expect.any(Number));
        expect(balance.current.quote.amount).toEqual(expect.any(String));
        expect(balance.current.quote.currency).toEqual(quoteCurrency.code);

        // only given if query includes includePending=true
        // expect(balance.pending.incoming.base.amount).toEqual(expect.any(String));
        // expect(balance.pending.incoming.base.currency).toEqual(expect.any(String));
        // expect(new Date(balance.pending.incoming.exchange.date)).toEqual(expect.any(Date));
        // expect(balance.pending.incoming.exchange.rate).toEqual(expect.any(Number));
        // expect(balance.pending.incoming.quote.amount).toEqual(expect.any(String));
        // expect(balance.pending.incoming.quote.currency).toEqual(expect.any(String));

        // expect(balance.pending.unconfirmed.base.amount).toEqual(expect.any(String));
        // expect(balance.pending.unconfirmed.base.currency).toEqual(expect.any(String));
        // expect(new Date(balance.pending.unconfirmed.exchange.date)).toEqual(expect.any(Date));
        // expect(balance.pending.unconfirmed.exchange.rate).toEqual(expect.any(Number));
        // expect(balance.pending.unconfirmed.quote.amount).toEqual(expect.any(String));
        // expect(balance.pending.unconfirmed.quote.currency).toEqual(expect.any(String));

        done(); 
    });

    it("gets wallet by wrong driver id, should return 403 - Forbidden", async (done) => {
        const response = await request(app)
            .get(`${basePath}/${driverID}1/wallet`)
            .set({
                "Authorization": `Bearer ${driverAuthToken}`
            });

        expect(response.status).toEqual(403);
        
        const walletResponse: JSendErrorResponse = response.body;

        expect(walletResponse.status).toEqual(JSendResponseStatus.Error);
        expect(walletResponse.message).toEqual(ErrorReason.Forbidden);
        expect(walletResponse.code).toBeNull;
        expect(walletResponse.data).toBeNull;
        
        done(); 
    });

});
