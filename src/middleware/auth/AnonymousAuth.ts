import { AbstractPassportAuthMiddleware } from "./PassportMiddleware";
import { Strategy as AnonymousStrategy } from "passport-anonymous";
import { Request, Response, NextFunction, Handler } from "express";

export class AnonymousAuth extends AbstractPassportAuthMiddleware {
    
    // MARK: - Public Properties
    readonly authStrategyName = "anonymous"

    // MARK: - Public Methods
    async initialize(): Promise<Handler> {
        this.passport.use(this.authStrategyName, new AnonymousStrategy());
        return super.initialize();
    }

    authenticate(request: Request, response: Response, next: NextFunction) {
        this.passport.authenticate(this.authStrategyName, { session: false })(request, response, next);
    }

}