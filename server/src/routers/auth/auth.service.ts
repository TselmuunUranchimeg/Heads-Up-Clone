import { Response } from "express";
import { hash, argon2id, verify } from "argon2";
import { v4 } from "uuid";
import { RegisterType, LoginType } from "./auth.types";
import { createDocument, findDocument } from "../../services/mongo/mongo";
import UserModel, { UserInterface } from "../../services/mongo/user";
import { saveToken, tokenIsInRedis, deleteToken } from "../../services/redis/redis";
import { TokenType } from "../../services/jwt/jwt";

const saveBothTokens = async (res: Response, accessTokenId: string, refreshTokenId: string, email: string) => {
    const access = await saveToken(TokenType.AccessToken, accessTokenId, email);
    const refresh = await saveToken(TokenType.RefreshToken, refreshTokenId, email);
    res.setHeader("Authorization", access);
    res.cookie("token", refresh, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        maxAge: 604800000
    });
}

const register = async (res: Response, body: RegisterType) => {
    //Check for email, and username
    let initialSearchEmail = await findDocument<UserInterface>(UserModel, {
        email: body.email
    });
    if (initialSearchEmail) {
        res.status(401).send("Email is already taken!!!");
        return;
    }
    let initialSearchUsername = await findDocument<UserInterface>(UserModel, {
        username: body.username
    });
    if (initialSearchUsername) {
        res.status(401).send("Username is already taken!!!");
        return;
    }

    //Save user data while creating two tokens in the background\
    body.password = await hash(body.password, { type: argon2id });
    let newAccessTokenId = v4();
    let newRefreshTokenId = v4();
    let document = await createDocument<UserInterface>(UserModel, { ...body });
    await saveBothTokens(res, newAccessTokenId, newRefreshTokenId, body.email);
    const { password, ...rest } = document.toJSON();
    res.status(200).json(rest);
};

const login = async (res: Response, body: LoginType) => {
    try {
        let user = await findDocument<UserInterface>(UserModel, {
            email: body.email
        });
        if (user) {
            if (await verify(user.password, body.password, { type: argon2id })) {
                await saveBothTokens(res, v4(), v4(), body.email);
                const { password, ...rest } = user.toJSON();
                res.status(200).json(rest);
                return;
            }
        }
        res.status(401).send("Email or password is wrong!!!");
    }
    catch (e) {
        console.log(e);
        res.status(500).send("Something went wrong with the server, please try again later!!!");
    }
};

const verifyReq = async (refreshToken: string, res: Response) => {
    try {
        const result = await tokenIsInRedis(refreshToken);
        if (result) {
            const { email, id } = result;
            await deleteToken(id);
            const user = await findDocument<UserInterface>(UserModel, { email });
            const { password, ...rest } = user!.toJSON();
            await saveBothTokens(res, v4(), v4(), email);
            res.status(200).json(rest);
            return;
        }
        res.status(401).end("You are not logged in!");
    }
    catch (e) {
        console.log(e);
        res.status(401).send("Not logged in!!!");
    }
};

export { register, login, verifyReq };
