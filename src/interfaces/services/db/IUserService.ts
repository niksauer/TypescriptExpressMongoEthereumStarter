import { IUser } from "../../database/IUser";
import { IDriverDocument, IDriver } from "../../database/IDriver";

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IUserService {
    saveUser(user: IUser): Promise<void>;
    deleteUser(user: IUser): Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IDriverService {
    createDriver(id: IDriverDocument["id"]): Promise<IDriverDocument>;
    getDriver(id: IDriverDocument["id"]): Promise<IDriverDocument | undefined>;
    saveDriver(driver: IDriver): Promise<void>;
    deleteDriver(driver: IDriver): Promise<void>;
    countDrivers(searchConditions: any): Promise<number>;
}