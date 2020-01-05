import { IUser, PublicUser, PUBLIC_USER_KEYS } from "./IUser";
import { IWallet } from "./IWallet";
import { pickKeys } from "../../model/util/helper";

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IDriver extends IUser {
    // refs
    walletID?: IWallet["id"];
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IDriverDocument extends IDriver {
    toPublic(): PublicDriver;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PublicDriver extends PublicUser {
}

const PUBLIC_DRIVER_KEYS: (keyof IDriver)[] = PUBLIC_USER_KEYS.concat([]);

export function toPublicDriver(driver: IDriver): PublicDriver {
    return pickKeys<PublicDriver>(driver, PUBLIC_DRIVER_KEYS);
}

