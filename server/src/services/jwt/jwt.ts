import { sign, verify, JwtPayload } from "jsonwebtoken";

export enum TokenType {
    RefreshToken = "7d",
    AccessToken = "15m"
}

const createToken = async (payload: any, tokenType: TokenType) => {
    return sign(payload, process.env.JWT_SECRET!, {
        issuer: process.env.ISSUER!,
        audience: process.env.AUDIENCE!,
        algorithm: "HS512",
        expiresIn: tokenType
    });
};

const verifyToken = (token: string): Promise<string | null> => {
    return new Promise((resolve) => {
        verify(token, process.env.JWT_SECRET!, {
            issuer: process.env.ISSUER!,
            audience: process.env.AUDIENCE!,
            algorithms: ["HS512"]
        }, (err, payload) => {
            if (err) {
                if (err.name === "TokenExpiredError") {
                    resolve(null);
                }
            }
            if (typeof payload !== "undefined" && typeof payload !== "string") {
                resolve(payload["id"] as string);
            }
        });
    });
};

export { createToken, verifyToken };
