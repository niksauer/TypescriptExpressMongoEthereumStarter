import { IUserService, IDriverService } from "../../../interfaces/services/db/IUserService";
import { User, UserDocument, DriverDocument, Driver, DriverDocumentPrototype, UserDocumentPrototype } from "../../database/User";
import { Role } from "../../../interfaces/database/IUser";

export class UserService implements IUserService, IDriverService {

    // MARK: - Private Properties

    // MARK: - Initialization

    // MARK: - Public Methods
    async createUser(id: UserDocument["id"], role: Role): Promise<UserDocument> {
        const user = new User({
            _id: id,
            role: role,
        } as UserDocumentPrototype);

        return await user.save();
    }

    async getUser(id: UserDocument["id"], role: Role): Promise<UserDocument | undefined> {
        const user = await User.findOne({ _id: id, role: role });

        if (user == null) {
            return undefined;
        }

        return user;
    }

    async saveUser(user: UserDocument): Promise<void> {
        await user.save();
    }

    async deleteUser(user: UserDocument): Promise<void> {
        await user.remove();
    }
    
    async searchUsers(searchConditions: any, role: Role): Promise<UserDocument[]> {
        searchConditions["role"] = role;
        return await User.find(searchConditions);
    } 

    async countUsers(searchConditions: any, role: Role): Promise<number> {
        searchConditions["role"] = role;
        return await User.countDocuments(searchConditions);
    }

    // MARK: Driver Service
    async createDriver(id: DriverDocument["id"]): Promise<DriverDocument> {
        const driver = new Driver({
            _id: id,
        } as DriverDocumentPrototype);

        return await driver.save();
    }

    async getDriver(id: DriverDocument["id"]): Promise<DriverDocument | undefined> {
        return this.getUser(id, Role.Driver) as any;
    }

    saveDriver(driver: DriverDocument): Promise<void> {
        return this.saveUser(driver);
    }

    deleteDriver(driver: DriverDocument): Promise<void> {
        return this.deleteUser(driver);
    }

    async countDrivers(searchConditions: any): Promise<number> {
        return this.countUsers(searchConditions, Role.Driver);
    }

}