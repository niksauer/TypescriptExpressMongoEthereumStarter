import { Router } from "express";

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IRouter {
    setup(): Router;
}