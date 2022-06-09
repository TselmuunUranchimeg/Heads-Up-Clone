import { Router } from "express";
import { body, validationResult } from "express-validator";
import { LoginType, RegisterType } from "./auth.types";
import { register, login, verifyReq as verify } from "./auth.service";

const router = Router({ mergeParams: true });

router.post(
    "/register",
    body("username").isString(),
    body("email").isEmail(),
    body("password").isString(), 
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(401).json({ errors: errors.array() });
            return;
        }
        let body = req.body as RegisterType;
        await register(res, body);
    }
);

router.post(
    "/login",
    body("email").isEmail(),
    body("password").isString(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(401).json({ errors: errors.array() });
            return;
        }
        let body = req.body as LoginType;
        await login(res, body);
    }
);

router.get("/verify", async (req, res) => {
    let refreshToken = req.cookies["token"] as string;
    if (refreshToken) {
        await verify(refreshToken, res);
        return;
    }
    res.status(401).send("Invalid cookie!!!");
});

export default router;