import { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import "./WaitingRoom.css";
import { get } from "../../../Extras/socket";
import { InitialState } from "../../../Extras/store";
import { Socket } from "socket.io-client";

interface StateInterface {
    password: string;
    rounds: number;
    wordType: string;
    playerCount: number;
}
interface LabelInfoInterface {
    name: string;
    value: string | number;
}
interface UserIconInterface {
    username: string;
}
interface PlayerInterface {
    username: string;
    uid: string;
}
interface PlayersAndTokensInterface {
    token: string;
    player: string;
}
interface ResponseInterface {
    appId: string;
    team1: PlayerInterface[];
    team2: PlayerInterface[];
    playersAndTokens: PlayersAndTokensInterface[];
}

const LabelInfo = ({ name, value }: LabelInfoInterface) => {
    return (
        <div className="label">
            <label>{name}</label>
            <p>{value}</p>
        </div>
    );
};
const UserIcon = ({ username }: UserIconInterface) => {
    return (
        <div>
            <p>{username}</p>
        </div>
    )
}

const WaitingRoom = () => {
    const location = useLocation();
    const [players, setPlayers] = useState<Array<string>>([]);
    const socket = useRef<Socket>();
    const navigate = useNavigate();
    const store = useSelector<InitialState, InitialState>(state => state);
    const state = JSON.parse(JSON.stringify(location.state)) as StateInterface;

    useEffect(() => {
        if (!socket.current) socket.current = get()

        socket.current?.on("newUserReadyRes", (arr: string[]) => setPlayers(arr));

        socket.current?.on("newUserJoined", (newUser: string) => {
            setPlayers(prev => {
                let slice = prev.slice();
                if (!slice.includes(newUser)) {
                    slice.push(newUser);
                }
                return slice;
            });
        });

        socket.current?.on("leftRoom", () => navigate("/"));

        socket.current?.on("userLeft", (username: string) => {
            setPlayers(prev => {
                if (prev.includes(username)) {
                    prev = prev.filter(item => item !== username);
                }
                return prev;
            });
        });

        socket.current?.on("leftRoom", (res: boolean) => {
            if (res) {
                navigate("/");
            }
        });

        socket.current?.on("gameReady", (res: ResponseInterface) => {
            const { playersAndTokens, ...rest } = res;
            let token = playersAndTokens.find(item => 
                item.player === store.username)!.token;
            navigate("/room/game", {
                state: { ...rest, token }
            });
        });
    }, [socket, navigate, store.username, store.channelName, state.rounds]);

    return (
        <div className="absolute waitingRoom-background">
            <Helmet>
                <title>Waiting for others to join - Heads Up Clone</title>
            </Helmet>
            <div className="waitingRoom">
                <h1>Waiting room</h1>
                <div className="waitingRoom-content">
                    <div className="waitingRoom-details">
                        <h2>Details</h2>
                        <LabelInfo value={store.channelName} name="Room id" />
                        <LabelInfo value={state.password} name="Password" />
                        <LabelInfo value={state.wordType} name="Word type" />
                        <LabelInfo value={state.rounds} name="Rounds" />
                        <LabelInfo
                            value={state.playerCount}
                            name="Player count"
                        />
                        <button 
                            onClick = {() => {
                                socket.current?.emit("leaveRoom", {
                                    channelName: store.channelName,
                                    username: store.username,
                                });
                            }}
                            className = "waitingRoom-button"
                        >
                            Leave room
                        </button>
                    </div>
                    <div className = "waitingRoom-dividingLine"></div>
                    <div className="waitingRoom-users">
                        <h2>Players</h2>
                        {players.map((val, ind) => (
                            <UserIcon key = {ind} username = {val} />
                        ))}
                        <button
                            onClick = {() => {
                                socket.current?.emit("leaveRoom", {
                                    channelName: store.channelName,
                                    username: store.username
                                });
                            }}
                            className = "waitingRoom-responsive-button"
                        >
                            Leave room
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaitingRoom;
