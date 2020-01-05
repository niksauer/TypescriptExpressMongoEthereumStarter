import { AbstractPassportAuthMiddleware } from "./PassportMiddleware";
import { AnonymousAuth } from "./AnonymousAuth";
import { MultiAuthMiddleware } from "./MultiAuth";

export class OptionalAuth extends MultiAuthMiddleware {

    // MARK: - Initialization
    constructor(authMethods: AbstractPassportAuthMiddleware[]) {
        const anonymousAuth = new AnonymousAuth();
        authMethods.push(anonymousAuth);
        
        super(authMethods);
    }

}