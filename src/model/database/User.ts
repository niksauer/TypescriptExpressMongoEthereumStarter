import mongoose, { Document, Schema, SchemaOptions } from "mongoose";
import { VALID_ROLES, IUserDocument, Role } from "../../interfaces/database/IUser";
import { IDriverDocument, toPublicDriver } from "../../interfaces/database/IDriver";
import { Wallet } from "./Wallet";
import { DatabaseCollection } from "../../interfaces/database/IDatabase";

// MARK: User
export interface UserDocumentPrototype {
    _id: UserDocument["id"];
    role: UserDocument["role"];
    registerAt?: UserDocument["registerAt"];
    isSuspended?: UserDocument["isSuspended"];
}


export interface UserDocument extends IUserDocument, Document {
    id: string;
}

// MARK: Driver
export interface DriverDocumentPrototype extends UserDocumentPrototype {
    role: Role.Driver;
}

export interface DriverDocument extends UserDocument, IDriverDocument {
}

const schemaOptions: SchemaOptions = {
    discriminatorKey: "kind",
    timestamps: true
};

enum UserType {
    Driver = "Driver",
}

const userSchema = new Schema({
    _id: { 
        type: String, 
        required: true
    },
    role: { 
        type: String, 
        required: true,
        enum: VALID_ROLES
    },
    registerAt: { 
        type: Date, 
        required: true,
        default: Date.now
    },
    isSuspended: {
        type: Boolean, 
        required: true,
        default: false
    },
}, schemaOptions);

const driverSchema = new Schema({
    // overwrite
    role: { 
        type: String, 
        required: true,
        default: Role.Driver
    },
    // refs
    walletID: {
        type: Schema.Types.ObjectId,
        ref: DatabaseCollection.Wallet
    },
});

userSchema.methods.toPublic = function() {
    const object = this.toObject({ virtuals: true });

    // discriminator behaviour
    switch (object.kind) {
    case UserType.Driver:
        return toPublicDriver(object);
    default:
        break;
    }
};

userSchema.pre("remove", async function(next) {
    const user = this as UserDocument;

    if (user.role == Role.Driver) {
        const driver = user as DriverDocument;

        if (driver.walletID) {
            await Wallet.deleteOne({ _id: driver.walletID }).exec();
        }
    }

    next();
});

export const User = mongoose.model<UserDocument>(DatabaseCollection.User, userSchema);
export const Driver = User.discriminator<DriverDocument>(UserType.Driver, driverSchema);

export async function clearUserCollection() { await User.remove({}).exec(); }
export async function clearDriverCollection() { await Driver.remove({}).exec(); }
