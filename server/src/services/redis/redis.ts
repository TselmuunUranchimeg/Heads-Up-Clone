import { createClient, RedisClientType } from "redis";
import { TokenType, createToken, verifyToken } from "../jwt/jwt";

let client: RedisClientType;

const initRedis = async () => {
    client = createClient();
    client.on("error", (e) => {
        console.log(e);
    });
    await client.connect();
    console.log("Created client for Redis!!!");
};

const saveToken = async (tokenType: TokenType, tokenId: string) => {
    let token = await createToken({ id: tokenId }, tokenType);
    await client.setEx(
        tokenId,
        tokenType === TokenType.AccessToken ? 900 : 604800,
        token
    );
    return token;
};

const tokenIsInRedis = async (token: string) => {
    let uuid = await verifyToken(token);
    if (uuid) {
        let tokenFromRedis = await client.GET(uuid);
        if (tokenFromRedis === token) {
            return uuid;
        }
    }
    return null;
};

const deleteToken = async (tokenId: string) => {
    await client.DEL(tokenId);
};

const saveCount = async (channelName: string) => {
    let value = await client.GET(channelName);
    if (!value) {
        await client.setEx(channelName, 20*60, "1");
        return 1;
    }
    value = (parseInt(value) + 1).toString();
    await client.setEx(channelName, 20*60, value);
    return parseInt(value);
};

export {
    initRedis,
    saveToken,
    tokenIsInRedis,
    deleteToken,
    saveCount
};
