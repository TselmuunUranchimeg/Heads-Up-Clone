import http from "http";
import { Server } from "socket.io";
import {
    CreateRoomInterface,
    JoinRoomInterface,
    NewUserReadyInterface,
    LeaveRoomInterface
} from "./beforeGame/beforeGame.type";
import {
    createRoom,
    joinRoom,
    newUserReady,
    leaveRoom
} from "./beforeGame/beforeGame.service";
import { ExchangeUIDInterface, NextWordInterface } from "./inGame/inGame.type";
import { exchangeUID, nextWord } from "./inGame/inGame.service";

const initSocket = async (server: http.Server) => {
    try {
        const io = new Server(server, {
            cors: {
                origin: process.env.AUDIENCE!,
                credentials: true,
                allowedHeaders: "*"
            }
        });
        console.log("Socket.io initialized!!!");
        io.on("connection", (socket) => {
            socket.on("createRoom", async (body: CreateRoomInterface) => {
                await createRoom(socket, body);
            });
            socket.on("joinRoom", async (body: JoinRoomInterface) => {
                await joinRoom(socket, body);
            });
            socket.on("newUserReady", async (body: NewUserReadyInterface) => {
                await newUserReady(socket, body, io);
            });
            socket.on("leaveRoom", async (body: LeaveRoomInterface) => {
                await leaveRoom(socket, body);
            });
            socket.on("exchangeUID", async (body: ExchangeUIDInterface) => {
                await exchangeUID(socket, body, io);
            });
            socket.on("nextWord", async (body: NextWordInterface) => {
                await nextWord(body, io);
            });
        });
    } catch (e) {
        throw e;
    }
};

export default initSocket;
