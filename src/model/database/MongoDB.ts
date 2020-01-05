import { IDatabase } from "../../interfaces/database/IDatabase";
import mongoose from "mongoose";
import { Dependency } from "../../make";
import { inject, injectable } from "tsyringe";

@injectable()
export class MongoDB implements IDatabase {

    // MARK: Public Properties
    readonly uri: string;
    readonly name: string;
    readonly collections: string[];

    // MARK: Initialization
    constructor(
        @inject(Dependency.DatabaseURI) uri: string,
        @inject(Dependency.DatabaseName) name: string,
        @inject(Dependency.DatabaseCollections) collections: string[],
    ) {
        this.uri = uri;
        this.name = name;
        this.collections = collections.map(collection => `${collection.toLowerCase()}s`);
    }

    // MARK: Public Methods
    async connect(): Promise<void> {
        await mongoose.connect(`${this.uri}/${this.name}`, { 
            useNewUrlParser: true, 
            useFindAndModify: false,
            useCreateIndex: true,
            useUnifiedTopology: true,
        });
    }

    async dropDatabase(): Promise<void> {
        await mongoose.connection.db.dropDatabase();
    }

    async dropCollections(): Promise<void> {
        const currentCollections = await mongoose.connection.db.collections();
        const currentCollectionNames = currentCollections.map(collection => collection.collectionName);
        
        for (const collection of this.collections) {
            if (!currentCollectionNames.includes(collection)) {
                continue;
            }

            await mongoose.connection.db.dropCollection(collection);
        }
    }

}