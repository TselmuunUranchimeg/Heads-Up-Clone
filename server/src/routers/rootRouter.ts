import { Router } from "express";
import authRouter from "./auth/auth.router";
import tokenRouter from "./room/room.router";

const rootRouter = Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/room", tokenRouter);

export default rootRouter;