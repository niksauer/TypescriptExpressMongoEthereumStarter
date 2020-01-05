import { AuthenticateOptions } from "passport";
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from "passport-jwt";
import { Request, Response, NextFunction, Handler } from "express";
import jwksRsa from "jwks-rsa";
import { ErrorReason, Error } from "../../model/util/error/Error";
import { IDriverService } from "../../interfaces/services/db/IUserService";
import { Dependency } from "../../make";
import { inject, singleton } from "tsyringe";
import { ILogger } from "../../interfaces/model/ILogger";
import { PassportAuthRegisterMiddleware } from "./PassportMiddleware";

@singleton()
export class DriverAuth extends PassportAuthRegisterMiddleware {
    
    // MARK: - Protected Properties
    protected readonly authOptions: AuthenticateOptions;
    protected readonly authCallbackFactory = (request: Request, response: Response, next: NextFunction) => {
        return (error: any, user: any, info: any) => {
            if (error) {
                return next(error);
            }

            if (!user) {
                response.status(401).jsend.error({ message: info.message });
                return;
            }

            request.user = user;
            next();
        };
    };
    
    protected readonly registerOptions: AuthenticateOptions;
    protected readonly registerCallbackFactory = (request: Request, response: Response, next: NextFunction) => {
        return (error: any, user: any, info: any) => {
            if (error) {
                return next(error);
            }

            if (!user) {
                switch (info.message) {
                case ErrorReason.AccountExists:
                    const error = new Error(ErrorReason.AccountExists);
                    response.status(error.statusCode).jsend.error({ message: error.reason });
                    break;
                default:
                    response.status(401).jsend.error({ message: info.message });
                    break;
                }
                return;
            }

            request.user = user;
            next();
        };
    }

    // MARK: - Private Properties
    private driverService: IDriverService;
    private logger: ILogger;

    // MARK: - Initialization
    constructor(
        @inject(Dependency.UserService) driverService: IDriverService,
        @inject(Dependency.Logger) logger: ILogger,
    ) {
        super("<openID service name>");
        
        this.driverService = driverService;
        this.logger = logger;
        
        const options = { session: false };
        this.authOptions = options;
        this.registerOptions = options;
    }

    // MARK: - Public Methods
    async initialize(): Promise<Handler> {
        const jwtOptions: StrategyOptions = {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKeyProvider: jwksRsa.passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: "<openID service url/v1/jwk>"
            }),
            issuer: "<openID service url>",
            algorithms: ["<openID service algorithms>"],
            ignoreExpiration: true
        };
        
        this.authStrategy = new JwtStrategy(jwtOptions, async (payload, done) => {
            // token verification passed
            const userID = payload.sub;
        
            this.logger.debug("Running driver auth middleware");
        
            try {
                const user = await this.driverService.getDriver(userID);

                if (user) {
                    return done(undefined, user);
                } 
                
                // user not found in db
                done(undefined, false, { message: ErrorReason.AccountNotFound });
            } catch (error) {
                done(error, false);
            }
        });

        this.registerStrategy = new JwtStrategy(jwtOptions, async (payload, done) => {
            // token verification passed
            const userID = payload.sub;
        
            this.logger.debug("Running driver registration middleware");
        
            try {
                const existingUser = await this.driverService.getDriver(userID);

                if (existingUser) {
                    return done(undefined, false, { message: ErrorReason.AccountExists });
                } 
                
                const user = await this.driverService.createDriver(userID);

                done(undefined, user);
            } catch (error) {
                done(error, false);
            }
        });

        return super.initialize();
    }

}