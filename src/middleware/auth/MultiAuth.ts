import { Request, Response, NextFunction, Handler } from "express";
import { PassportMiddleware, AbstractPassportAuthMiddleware } from "./PassportMiddleware";
import { AuthMiddleware } from "../../interfaces/middleware/AuthMiddleware";

export class MultiAuthMiddleware extends PassportMiddleware implements AuthMiddleware {

    // MARK: - Private Properties
    protected readonly authMethods: AbstractPassportAuthMiddleware[];

    // MARK: - Initialization
    constructor(authMethods: AbstractPassportAuthMiddleware[]) {
        super();

        this.authMethods = authMethods;

        // method binding
        this.authenticate = this.authenticate.bind(this);
    }

    // MARK: - Public Methods
    async initialize(): Promise<Handler> {
        for (const authMethod of this.authMethods) {
            await authMethod.initialize();
        }
        
        return super.initialize();
    }

    authenticate(request: Request, response: Response, next: NextFunction) {
        this.passport.authenticate(this.authMethods.map(method => method.authStrategyName), { session: false })(request, response, next);
    }

}