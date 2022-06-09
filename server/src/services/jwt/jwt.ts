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

const verifyToken = async (token: string): Promise<string | undefined> => {
    let payload = verify(token, process.env.JWT_SECRET!, {
        issuer: process.env.ISSUER!,
        audience: process.env.AUDIENCE!,
        algorithms: ["HS512"]
    }) as JwtPayload;
    if (payload) {
        return payload["id"] as string;
    }
    return undefined;
};

export { createToken, verifyToken };
