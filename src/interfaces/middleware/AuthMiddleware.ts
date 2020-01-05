import { Request, Response, NextFunction } from "express";

export interface AuthMiddleware {
    authenticate(request: Request, response: Response, next: NextFunction): void;
}

export interface RegisterMiddleware {
    register(request: Request, response: Response, next: NextFunction): void;
}

export type AuthRegisterMiddleware = AuthMiddleware & RegisterMiddleware;