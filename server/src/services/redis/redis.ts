import { createClient, RedisClientType } from "redis";
import { TokenType, createToken, verifyToken } from "../jwt/jwt";

let client: RedisClientType;

const initRedis = async () => {
    client = createClient({
        url: `redis://${process.env.REDIS_ENDPOINT!}`,
        password: process.env.REDIS_PASSWORD!
    });
    client.on("error", (e) => {
        console.log(e);
    });
    await client.connect();
    console.log("Created client for Redis!!!");
};

const saveToken = async (tokenType: TokenType, tokenId: string, email: string) => {
    let token = await createToken({ id: tokenId }, tokenType);
    await client.setEx(
        tokenId,
        tokenType === TokenType.AccessToken ? 900 : 604800,
        email
    );
    return token;
};

const tokenIsInRedis = async (token: string) => {
    try {
        let id = await verifyToken(token);
        if (id) {
            let email = await client.GET(id);
            if (email) {
                return { email, id };
            }
        }
        return null;
    }
    catch (e) {
        return null;
    }
};

const deleteToken = async (tokenId: string) => {
    if (await client.GET(tokenId)) {
        await client.DEL(tokenId);
    }
};

export {
    initRedis,
    saveToken,
    tokenIsInRedis,
    deleteToken
};
