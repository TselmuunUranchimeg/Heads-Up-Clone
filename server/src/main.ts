import { createServer } from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import rootRouter from "./routers/rootRouter";
import { initRedis } from "./services/redis/redis";
import { connectToDb } from "./services/mongo/mongo";
import initSocket from "./socket/socket";

(async () => {
    const app = express();
    const server = createServer(app);

    app.use(cors({
        origin: process.env.AUDIENCE!,
        allowedHeaders: ["Content-Type", "Authorization"],
        methods: ["GET", "POST"],
        credentials: true,
        exposedHeaders: ["Authorization"],
    }));
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use("/", rootRouter);

    await initRedis();
    await connectToDb();
    await initSocket(server);
    server.listen(process.env.PORT! || 8000, () => {
        console.log("Server has started!!!");
    });
})();
