import { Response } from "express";
import { hash, argon2id, verify } from "argon2";
import { v4 } from "uuid";
import { RegisterType, LoginType } from "./auth.types";
import { createDocument, findDocument } from "../../services/mongo/mongo";
import UserModel, { UserInterface } from "../../services/mongo/user";
import { saveToken, tokenIsInRedis, deleteToken } from "../../services/redis/redis";
import { TokenType } from "../../services/jwt/jwt";

const saveBothTokens = async (
    res: Response,
    accessTokenId: string,
    refreshTokenId: string
) => {
    let refreshToken = await saveToken(TokenType.RefreshToken, refreshTokenId);
    let accessToken = await saveToken(TokenType.AccessToken, accessTokenId);
    res.cookie("token", refreshToken, {
        maxAge: 604800000,
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/"
    });
    res.header("authorization", accessToken);
};

const updateUserTokens = async (res: Response, dataToFind: any) => {
    let newAccessTokenId = v4();
    let newRefreshTokenId = v4();
    let saveBothTokensPromise = saveBothTokens(
        res,
        newAccessTokenId,
        newRefreshTokenId
    );
    let user = await findDocument<UserInterface>(UserModel, dataToFind);
    let deleteAccessPromise = deleteToken(user!.accessTokenId);
    let deleteRefreshPromise = deleteToken(user!.refreshTokenId);
    await Promise.all([deleteAccessPromise, deleteRefreshPromise]);
    user!.accessTokenId = newAccessTokenId;
    user!.refreshTokenId = newRefreshTokenId;
    await Promise.all([saveBothTokensPromise, user!.save()]);
    return user;
};

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
    let document = await createDocument<UserInterface>(UserModel, {
        accessTokenId: newAccessTokenId,
        refreshTokenId: newRefreshTokenId,
        ...body
    });
    await saveBothTokens(res, newAccessTokenId, newRefreshTokenId);
    const { _id, __v, password, id, accessTokenId, refreshTokenId, ...rest } =
        document.toJSON();
    res.status(200).json(rest);
};

const login = async (res: Response, body: LoginType) => {
    try {
        let user = await findDocument<UserInterface>(UserModel, {
            email: body.email
        });
        if (user) {
            if (await verify(user.password, body.password, { type: argon2id })) {
                await updateUserTokens(res, { email: body.email });
                const {
                    __v,
                    _id,
                    id,
                    password,
                    accessTokenId,
                    refreshTokenId,
                    ...rest
                } = user.toJSON();
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
        let tokenId = await tokenIsInRedis(refreshToken);
        if (tokenId) {
            let user = await updateUserTokens(res, { refreshTokenId: tokenId });
            const {
                __v,
                _id,
                password,
                id,
                accessTokenId,
                refreshTokenId,
                ...rest
            } = user!.toJSON();
            res.status(200).json(rest);
            return;
        }
        res.status(401).send("Not logged in!!!");
    }
    catch (e) {
        console.log(e);
        res.status(401).send("Not logged in!!!");
    }
};

export { register, login, verifyReq };
