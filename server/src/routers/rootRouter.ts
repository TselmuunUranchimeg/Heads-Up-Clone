import { Router } from "express";
import authRouter from "./auth/auth.router";
import tokenRouter from "./room/room.router";

const rootRouter = Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/room", tokenRouter);

rootRouter.get("/", (_, res) => {
    res.end("Coming from rootRouter, working just fine!!!");
});

export default rootRouter;