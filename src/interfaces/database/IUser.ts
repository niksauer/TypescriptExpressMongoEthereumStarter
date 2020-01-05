import { pickKeys } from "../../model/util/helper";

export enum Role {
    Driver = "driver",
}

export const ROLES: Role[] = [
    Role.Driver, 
];

export const VALID_ROLES: Role[] = ROLES;

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IUser {
    id: string;
    role: Role;
    registerAt: Date;
    isSuspended: boolean;
}

// eslint-disable-next-line
export interface IUserDocument extends IUser {
}

export interface PublicUser {
    id: IUser["id"];
    role: IUser["role"];
    registerAt: IUser["registerAt"];
    isSuspended: IUser["isSuspended"];
}

export const PUBLIC_USER_KEYS: (keyof IUser)[] = [
    "id", 
    "role",
    "registerAt",
    "isSuspended",
];

export function toPublicUser(user: IUser): PublicUser {
    return pickKeys<PublicUser>(user, PUBLIC_USER_KEYS);
}