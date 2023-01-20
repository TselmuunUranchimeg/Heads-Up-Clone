import { io, Socket } from "socket.io-client";

let socketIns: Socket;

const set = () => {
    socketIns = io("http://localhost:8000");
}

const get = () => {
    return socketIns;
}

export { set, get };