import { Request, Response, NextFunction, Handler } from "express";
import passport, { PassportStatic, Strategy, AuthenticateOptions } from "passport";
import { AuthMiddleware, RegisterMiddleware } from "../../interfaces/middleware/AuthMiddleware";
import { Error, ErrorReason } from "../../model/util/error/Error";
import { Middleware } from "../../interfaces/middleware/Middleware";

type CallbackFactory = (request: Request, response: Response, next: NextFunction) => (error: any, user: any, info: any) => any;

export abstract class PassportMiddleware implements Middleware {
    
    // MARK: - Protected Properties
    protected readonly passport: PassportStatic;

    // MARK: - Initialization
    constructor() {
        this.passport = passport;
    }

    // MARK: - Public Methods
    async initialize(): Promise<Handler> {
        return this.passport.initialize();
    }

}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export abstract class AbstractPassportAuthMiddleware extends PassportMiddleware implements AuthMiddleware {
    abstract readonly authStrategyName: string;
    abstract authenticate(request: Request, response: Response, next: NextFunction): void;
}

export abstract class PassportAuthMiddleware extends AbstractPassportAuthMiddleware {
    
    // MARK: - Public Properties
    readonly authStrategyName: string;

    // MARK: - Protected Properties
    protected authStrategy?: Strategy;
    protected abstract readonly authOptions: AuthenticateOptions;
    protected abstract readonly authCallbackFactory: CallbackFactory;
        
    // MARK: - Initialization
    constructor(name: string) {
        super();
        this.authStrategyName = name;

        // method binding
        this.initialize = this.initialize.bind(this);
        this.authenticate = this.authenticate.bind(this);
    }

    // MARK: - Public Methods
    async initialize(): Promise<Handler> {
        if (!this.authStrategy) {
            throw new Error(ErrorReason.MiddlewareNotInitialized);
        }

        this.passport.use(this.authStrategyName, this.authStrategy);
        
        return super.initialize();
    }

    authenticate(request: Request, response: Response, next: NextFunction) {
        this.passport.authenticate(this.authStrategyName, this.authOptions, this.authCallbackFactory(request, response, next))(request, response, next);
    }

}

export abstract class PassportAuthRegisterMiddleware extends PassportAuthMiddleware implements RegisterMiddleware {
    
    // MARK: - Public Properties
    get registerStrategyName(): string {
        return `${this.authStrategyName}Register`;
    }

    // MARK: - Protected Properties
    protected registerStrategy?: Strategy;
    protected abstract readonly registerOptions: AuthenticateOptions;
    protected abstract readonly registerCallbackFactory: CallbackFactory;

    // MARK: - Initialization
    constructor(name: string) {
        super(name);

        // method binding
        this.register = this.register.bind(this);
    }

    // MARK: - Public Methods
    async initialize(): Promise<Handler> {
        if (!this.registerStrategy) {
            throw new Error(ErrorReason.MiddlewareNotInitialized);
        }

        this.passport.use(this.registerStrategyName, this.registerStrategy);
        return super.initialize();
    }

    register(request: Request, response: Response, next: NextFunction) {
        this.passport.authenticate(this.registerStrategyName, this.registerOptions, this.registerCallbackFactory(request, response, next))(request, response, next);
    }

}