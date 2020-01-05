import { Handler } from "express";

export interface Middleware {
    initialize(): Promise<Handler>;
}