import express, { Application } from "express";
import "express-async-errors";
import compression from "compression";
import bodyParser from "body-parser";
import jsend from "jsend";
import { injectable, inject } from "tsyringe";
import { CurrencyType } from "./interfaces/model/currency/Currency";
import { Dependency } from "./make";
import { Error, ErrorReason } from "./model/util/error/Error";
import { ValidationError } from "./model/util/error/ValidationError";
import { ILogger } from "./interfaces/model/ILogger";
import { Middleware } from "./interfaces/middleware/Middleware";
import { IDatabase } from "./interfaces/database/IDatabase";
import { IExchangeDaemon } from "./interfaces/model/daemon/IExchange";
import { ICurrencyManager } from "./interfaces/model/currency/ICurrencyManager";
import { Stage, AppConfig } from "./model/util/config/AppConfig";
import { ConnectionConfig } from "./model/util/config/ConnectionConfig";
import swaggerUI from "swagger-ui-express";
import YAML from "yamljs";
import { FileUploadError } from "./model/util/error/FileUploadError";
import cors from "cors";
import { IRouter } from "./interfaces/Router";

export interface Endpoint {
    path: string; 
    router: IRouter;
}

@injectable()
export class Backend {
    
    // MARK: - Public Properties
    readonly appConfig: AppConfig;
    readonly connectionConfig: ConnectionConfig;

    get basePath(): string {
        return `/api/v${this.appConfig.version}`;
    }
    
    // MARK: - Private Properties
    private readonly endpoints: Endpoint[];
    private readonly middleware: Middleware[];
    private readonly exchangeDaemon: IExchangeDaemon;
    private readonly currencyManager: ICurrencyManager;
    private readonly logger: ILogger;
    private readonly database: IDatabase;
    
    private readonly app: Application;

    // MARK: - Initialization
    constructor(
        @inject(Dependency.AppConfig) appConfig: AppConfig,
        @inject(Dependency.ConnectionConfig) connectionConfig: ConnectionConfig,
        @inject(Dependency.Endpoints) endpoints: Endpoint[],
        @inject(Dependency.Middleware) middleware: Middleware[],
        @inject(Dependency.ExchangeDaemon) exchangeDaemon: IExchangeDaemon,
        @inject(Dependency.CurrencyManager) currencyManager: ICurrencyManager,
        @inject(Dependency.Logger) logger: ILogger,
        @inject(Dependency.Database) database: IDatabase
    ) {
        this.appConfig = appConfig;
        this.connectionConfig = connectionConfig;
        this.endpoints = endpoints;
        this.middleware = middleware;
        this.exchangeDaemon = exchangeDaemon;
        this.currencyManager = currencyManager;
        this.logger = logger;
        this.database = database;

        this.app = express();
    }

    // MARK: - Public Methods
    async setup(): Promise<Application> {
        await this.connectToDatabase();   
        await this.setupDaemons();     

        await this.initMiddleware();
        this.initRoutes();
        this.initResponseMiddleware();
        this.initErrorMiddleware();

        return this.app;
    }

    // MARK: - Private Methods
    // MARK: Boostrap
    private async connectToDatabase() {
        try {
            await this.database.connect();

            this.logger.debug("Connection to database established");
        } catch (error) {
            this.logger.error("Database connection error. Please make sure database is running. " + error);
            throw new Error(ErrorReason.DatabaseUnreachable);
        }
    }

    private async setupDaemons() {
        // exchange daemon
        const currencyPairs = this.currencyManager.getCurrencyPairs(CurrencyType.Crypto, CurrencyType.Fiat);
        currencyPairs.forEach(currencyPair => this.exchangeDaemon.addCurrencyPair(currencyPair));
        await this.exchangeDaemon.update();
        await this.exchangeDaemon.start();
    }

    // MARK: Pre-Route(r) Middleware
    private async initMiddleware() {
        this.app.use(compression());

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

        this.app.use(jsend.middleware);

        this.app.use(cors({
            allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "X-Access-Token", "Authorization"],
            credentials: false,
            methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
            origin: "http://localhost:4200",
            preflightContinue: true
        }));

        for (const middleware of this.middleware) {
            await middleware.initialize();
        }

        this.app.use((request, response, next) => {
            this.logger.debug(`${request.method} ${request.url}`);
            next();
        });
    }

    // MARK: Route(rs)
    private initRoutes() {
        // NOTE: parent middleware > pre-route router middleware > pre-route router param middleware > route > post-route router middleware > parent response middleware
        // alternative: create rootRouter > rootRouter.use("/driver", driverRouter); > allows adding global middleware
        this.endpoints.forEach(endpoint => {
            this.app.use(`/api/v${this.appConfig.version}/${endpoint.path}`, endpoint.router.setup());
        });

        // const swaggerYamlFile = fileSystem.readFileSync("swagger.json", "utf8");
        const swaggerDocument: swaggerUI.JsonObject = YAML.load("swagger.yaml");

        const swaggerOptions: swaggerUI.SwaggerOptions = {
            customCss: ".swagger-ui .topbar { display: none }"
        };

        this.app.use(`${this.basePath}/info`, swaggerUI.serve, swaggerUI.setup(swaggerDocument, swaggerOptions));

        // this.app.use(express.static("public"));
    }

    // MARK: Post-Route(r) Middleware
    private initResponseMiddleware() {
        this.app.use((request, response, next) => {
            if (!response.headersSent) {
                // non-successful response
                const error = new Error(ErrorReason.RouteNotFound);
                const errorMessage = `Cannot ${request.method} ${request.url}`;
                this.logger.debug(errorMessage);
                
                this.logger.debug(`Replying with (${error.statusCode}) - ${error.reason}`);

                response.status(error.statusCode).jsend.error({ 
                    message: errorMessage 
                });

                return;
            }

            // successful response (inferred from sent header)
            this.logger.debug(`Served ${request.method} ${request.url}`);
    
            // middleware chain is terminated since next is not called
            // next();
        });
    }

    // MARK: Error Middleware
    private initErrorMiddleware() {
        this.app.use(((error, request, response, next) => {
            if (response.headersSent && error == "stopMatch") {
                this.logger.debug(`Served ${request.method} ${request.url}`);
                return;
            }

            this.logger.error("Running (app) error middleware ...");

            if (response.headersSent) {
                // request is assumed to have been served successfully by previous middleware/route
                this.logger.error("... even though response has already been sent");   
                return;
            }

            // handle error
            if (error instanceof ValidationError) {
                this.logger.debug(`Replying with (${error.statusCode}) - ${error.reason}`);

                response.status(error.statusCode).jsend.fail(error.response);
            } else if (error instanceof FileUploadError) {
                this.logger.debug(`Replying with (${error.statusCode}) - ${error.reason}`);

                response.status(error.statusCode).jsend.fail(error.response);
            } else if (error instanceof Error) {
                let finalError: Error = error;        

                if (!error.isKnownExternally(this.appConfig.stage != Stage.Production)) {
                    finalError = new Error(ErrorReason.InternalServerError);
                }

                this.logger.debug(`Replying with (${finalError.statusCode}) - ${finalError.reason}`);

                response.status(finalError.statusCode).jsend.error({
                    message: finalError.reason,
                });
            } else {
                const finalError = new Error(ErrorReason.InternalServerError);
                const data = this.appConfig.stage == Stage.Production ? undefined : error;
                
                this.logger.error(error);

                response.status(finalError.statusCode).jsend.error({
                    message: finalError.reason,
                    data: data
                });
            }
            
            // next(error); // handoff to next error handler
        }) as express.ErrorRequestHandler);
    }
    
}