import { io, Socket } from "socket.io-client";

let socketIns: Socket;

const set = () => {
    socketIns = io("https://heads-up-clone-server.onrender.com");
}

const get = () => {
    return socketIns;
}

export { set, get };