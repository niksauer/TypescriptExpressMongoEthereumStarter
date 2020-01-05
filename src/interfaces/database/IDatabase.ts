export enum DatabaseCollection {
    User = "User",
    Wallet = "Wallet",
    Transaction = "Transaction",
    ExchangeRate = "ExchangeRate",
}

export const DATABASE_COLLECTIONS: DatabaseCollection[] = [
    DatabaseCollection.User,
    DatabaseCollection.Wallet,
    DatabaseCollection.Transaction,
    DatabaseCollection.ExchangeRate,
];

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IDatabase {
    readonly uri: string;
    readonly name: string;
    connect(): Promise<void>;
    dropDatabase(): Promise<void>;
    dropCollections(): Promise<void>;
}