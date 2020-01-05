import uuid from "uuid/v4";
import { IUUIDService } from "../../../interfaces/services/general/IUUIDService";

export class UUIDService implements IUUIDService {
    generateUUID(): string {
        return uuid();
    }
}