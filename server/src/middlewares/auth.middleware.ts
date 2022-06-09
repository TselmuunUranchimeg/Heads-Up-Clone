import { Request, Response, NextFunction } from "express";
import { tokenIsInRedis } from "../services/redis/redis";

export enum AuthState {
    Authorized,
    NotAuthorized
}

const AuthMiddleware = (requiredState: AuthState) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        let state = AuthState.NotAuthorized;
        let accessToken = req.headers["authorization"];
        if (accessToken) {
            let result = await tokenIsInRedis(accessToken);
            if (result) {
                state = AuthState.Authorized;
            }
        }
        if (state === requiredState) {
            next();
        } else {
            res.status(401).send(
                `${
                    requiredState === AuthState.Authorized
                        ? "You are not logged in!"
                        : "You are already logged in!"
                }`
            );
            return;
        }
    };
};

export { AuthMiddleware };