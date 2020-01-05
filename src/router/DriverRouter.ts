import { Router, Handler, Request, Response, NextFunction } from "express";
import { DriverController } from "../controller/DriverController";
import { ErrorReason, Error } from "../model/util/error/Error";
import { injectable, inject } from "tsyringe";
import { AuthRegisterMiddleware } from "../interfaces/middleware/AuthMiddleware";
import { Dependency } from "../make";
import { ILogger } from "../interfaces/model/ILogger";
import { IDriver, IDriverDocument } from "../interfaces/database/IDriver";
import { IUser, Role, IUserDocument } from "../interfaces/database/IUser";
import paginate from "express-paginate";
import { IDriverService } from "../interfaces/services/db/IUserService";
import { IRouter } from "../interfaces/Router";

@injectable()
export class DriverRouter implements IRouter {
    
    // MARK: - Private Properties
    private controller: DriverController;
    private driverAuthMiddleware: AuthRegisterMiddleware;
    private logger: ILogger;
    private driverService: IDriverService;

    private router: Router;

    // MARK: - Initialization
    constructor(
        controller: DriverController,
        @inject(Dependency.DriverAuthMiddleware) driverAuthMiddleware: AuthRegisterMiddleware,
        @inject(Dependency.Logger) logger: ILogger,
        @inject(Dependency.DriverService) driverService: IDriverService,
    ) {
        this.controller = controller;
        this.driverAuthMiddleware = driverAuthMiddleware;
        this.logger = logger;
        this.driverService = driverService;

        this.router = Router({ mergeParams: true });
    }

    // MARK: - Public methods
    setup(): Router {
        // MARK: - Pre-Route Middleware
        // /^\/.+$/ includes everyting but GET & POST /
        this.router.all(/^\/.+$/, this.driverAuthMiddleware.authenticate);

        // MARK: - Pre-Route Param Middleware

        // MARK: - Routes
        this.router.post("/", this.driverAuthMiddleware.register, this.controller.createDriver);
        this.router.get("/", this.driverAuthMiddleware.authenticate, this.controller.getDriverByToken);

        this.router.get("/:driverID", this.prepare(true, true), this.controller.getDriver);
        this.router.delete("/:driverID", this.prepare(true, true), this.controller.deleteDriver);

        this.router.get("/:driverID/wallet", this.prepare(true, true), this.controller.getDriverWallet);

        
        this.router.put("/:driverID/wallet", this.prepare(true, true), this.controller.createOrUpdateDriverWallet);
        this.router.delete("/:driverID/wallet", this.prepare(true, true), this.controller.deleteDriverWallet);

        this.router.get("/:driverID/wallet/balance", this.prepare(true, true), this.controller.getDriverWalletBalance);
        this.router.post("/:driverID/wallet/transfer", this.prepare(true, true), this.controller.transferDriverWalletFunds);

        this.router.get("/:driverID/transactions", this.prepare(true, true), paginate.middleware(10, 50), this.controller.searchDriverTransactions);
        
        // MARK: - Post-Route Middleware

        return this.router;
    }

    // MARK: - Private Methods
    // MARK: Helper
    private prepare(checkAuthorization: boolean, loadBaseResource: boolean): Handler {
        return async (request: Request, response: Response, next: NextFunction) => {            
            const authenticatedUser = request.user as IUser | undefined;
            const requestedDriverID = request.params.driverID;

            if (checkAuthorization) {
                if (!authenticatedUser) {
                    throw new Error(ErrorReason.Unauthorized);
                }

                this.checkAuthorization(authenticatedUser, requestedDriverID);
            }

            if (loadBaseResource) {
                request.baseResource = await this.loadBaseResource(requestedDriverID, authenticatedUser);
            }

            next();
        };
    }

    private checkAuthorization(authenticatedUser: IUser, requestedDriverID: IDriver["id"]) {
        this.logger.debug("Performing /driver/:driverID authorization check");

        if (requestedDriverID == authenticatedUser.id && authenticatedUser.role == Role.Driver) {
            return;
        }

        throw new Error(ErrorReason.Forbidden);
    }

    private async loadBaseResource(requestedDriverID: IDriver["id"], authenticatedUser: IUserDocument| undefined): Promise<IDriverDocument> {
        this.logger.debug("Loading /driver base resource");

        if (authenticatedUser != undefined && requestedDriverID == authenticatedUser.id && authenticatedUser.role == Role.Driver) {
            return authenticatedUser as IDriverDocument;
        }

        const driver = await this.driverService.getDriver(requestedDriverID);

        if (!driver) {
            throw new Error(ErrorReason.DriverNotFound);
        }

        return driver;
    }

}