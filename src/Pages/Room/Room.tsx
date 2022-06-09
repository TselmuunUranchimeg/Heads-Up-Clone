import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import CreateRoom from "./CreateRoom/CreateRoom";
import GameRoom from "./GameRoom/GameRoom";
import JoinRoom from "./JoinRoom/JoinRoom";
import WaitingRoom from "./WaitingRoom/WaitingRoom";
import { InitialState } from "../../Extras/store";

const Room = () => {
    const store = useSelector<InitialState, InitialState>(state => state);
    const location = useLocation();
    const arr = ["/room/game", "/room/wait"];

    if (store.accessToken === "" && store.username === "") {
        return <Navigate to = "/auth/login" replace = {true} />
    }
    if (arr.includes(location.pathname)) {
        if (store.channelName === "") {
            return <Navigate to = "/room/create" replace = {true} />
        }
    }

    return (
        <Routes>
            <Route path = "join" element = {<JoinRoom />} />
            <Route path = "create" element = {<CreateRoom />} />
            <Route path = "game" element = {<GameRoom />} />
            <Route path = "wait" element = {<WaitingRoom />} />
            <Route path = "*" element = {<Navigate to = "/" replace />} />
        </Routes>
    )
}

export default Room;