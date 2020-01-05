export enum AssertError {
    SettledBaseCurrencyAmountExpected,   
    
    ContractInteractionConfirmedStatusExpected,
    ContractInteractionPendingStatusExpected,
    ContractInteractionExpected,

    CurrencyExpected,

    ERC20TokenContractAddressExpected,
    
    CurrencyPairExpected,

    FiatCurrencyNameExpected,
    FiatCurrencySymbolExpected,

    CryptoCurrencyNameExpected,
    CryptoCurrencySymbolExpected,
    CryptoCurrencyDecimalDigitsExpected,
    CryptoCurrencyBaseUnitNameExpected,
    CryptoCurrencyAsBaseCurrencyExpected,
    
    WalletExpected,
    ManagedWalletExpected,

    StoredExchangeRateExpected,

    AppStateManagerSetupExpected,
    SingleAppStateExpected,

    InMemoryMongoDbUrlExpected,
    TestConfigExpected,
}

export function assert(condition: boolean, error: AssertError): asserts condition {
    if (!condition) {
        throw error;
    }
}