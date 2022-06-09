import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useLocation,  Link } from "react-router-dom";
import AgoraRTC, { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { Socket } from "socket.io-client";
import "./GameRoom.css";
import { get } from "../../../Extras/socket";
import { InitialState } from "../../../Extras/store";

interface PlayerInterface {
    username: string;
    uid: string;
}
interface PlayerComponentInterface extends PlayerInterface {
    className: string;
}
interface StateInterface {
    appId: string;
    token: string;
    team1: PlayerInterface[];
    team2: PlayerInterface[];
}
interface PlayerArrayInterface {
    players: Array<PlayerInterface>;
    className: string;
}
interface NewWordInterface {
    word: string;
    teamSide: number;
    player: string;
    intervalId: number;
}
interface TeamsInterface {
    team1: PlayerInterface[];
    team2: PlayerInterface[];
}
interface GamePlayerInterface {
    username: string;
    gotCorrect: number;
    gotWrong: number;
}
interface GameEndInterface {
    channelName: string;
    rounds: number;
    wordType: string;
    team1: Array<GamePlayerInterface>;
    team2: Array<GamePlayerInterface>;
}
interface SetTimerInterface {
    timer: number;
}
interface ScoreSectionInterface {
    team: Array<GamePlayerInterface> | undefined;
    side: string;
}

const Player = ({ username, uid, className }: PlayerComponentInterface) => {
    const [name, setName] = useState("");

    useEffect(() => {
        if (uid === "") {
            setName("Loading...");
        } else {
            setName(username);
        }
    }, [uid, username]);

    return (
        <div className={`player ${className}`}>
            <p>{name}</p>
        </div>
    );
};
const PlayerArray = ({ players, className }: PlayerArrayInterface) => {
    return (
        <div className={`player-array ${className}`}>
            {players.map((value, index) => (
                <Player
                    username={value.username}
                    uid={value.uid}
                    key={index}
                    className={
                        index === players.length - 1 ? "border-bottom-none" : ""
                    }
                />
            ))}
        </div>
    );
};
const ScoreSection = ({ team, side }: ScoreSectionInterface) => {
    const [wins, setWins] = useState(0);
    const [losses, setLosses] = useState(0);

    useEffect(() => {
        setWins(() => {
            let result = 0;
            team?.forEach(val => {
                result+= val.gotCorrect;
            });
            return result;
        });
        setLosses(() => {
            let result = 0;
            team?.forEach(val => {
                result+= val.gotWrong;
            });
            return result;
        });
    }, [team]);

    return (
        <div className = "gameEnd-content-scoreTable">
            <h3>{`${side} ${wins} - ${losses}`}</h3>
            <div className = "gameEnd-table">
                <div className = "gameEnd-table-row">
                    <p>Username</p>
                    <p>Got correct</p>
                    <p>Got wrong</p>
                </div>
                {team?.map((val, ind) => {
                    return (
                        <div key = {ind} className = "gameEnd-table-row">
                            <p>
                                {
                                    window.innerWidth > 425 
                                    ? val.username 
                                    : `${val.username.substring(0, 4)}...`
                                }
                            </p>
                            <p>{val.gotCorrect}</p>
                            <p>{val.gotWrong}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const GameRoom = () => {
    const state = useLocation().state as StateInterface;
    const store = useSelector<InitialState, InitialState>((state) => state);
    const socket = useRef<Socket>();
    const teamSide = useRef<number>();
    const [teams, setTeams] = useState<TeamsInterface>({
        team1: state.team1,
        team2: state.team2
    });
    const [word, setWord] = useState("Loading...");
    const [disabled, setDisabled] = useState(false);
    const [timer, setTimer] = useState(30);
    const [answeringPlayer, setAnsweringPlayer] = useState("");
    const [intervalId, setIntervalId] = useState(0);
    const [isGameOver, setGameOver] = useState<null | GameEndInterface>(null);
    const client = useRef<IAgoraRTCClient>();

    const updateTeams = (
        body: TeamsInterface,
        uid: string,
        username: string
    ): TeamsInterface => {
        let obj = body.team1.find((item) => item.username === username);
        if (!obj) {
            obj = body.team2.find((item) => item.username === username);
        }
        obj!.uid = uid;
        return { ...body };
    };
    const gotRight = () => {
        socket.current?.emit("nextWord", {
            intervalId, word, 
            teamSide: teamSide.current,
            channelName: store.channelName,
            username: answeringPlayer
        });
        setTimer(30);
        setWord("Loading...");
    };

    useEffect(() => {
        if (!socket.current) socket.current = get();
        if (!client.current) {
            try {
                client.current = AgoraRTC.createClient({
                    codec: "h264",
                    mode: "rtc"
                });
                client.current
                    .join(state.appId, store.channelName, state.token)
                    .then(async (uid) => {
                        setTeams((prev) => {
                            return updateTeams(
                                prev,
                                uid.toString(),
                                store.username
                            );
                        });
                        socket.current?.emit("exchangeUID", {
                            uid: uid.toString(),
                            username: store.username,
                            channelName: store.channelName
                        });
                        let audioTrack =
                            await AgoraRTC.createMicrophoneAudioTrack();
                        await client.current?.publish([audioTrack]);
                        client.current?.remoteUsers.forEach(async (user) => {
                            await client.current?.subscribe(user, "audio");
                            user.audioTrack?.play();
                        });
                        console.clear();
                    });
            } catch (e) {
                throw e;
            }
        }
        if (!teamSide.current) {
            let user = state.team1.find(
                (item) => item.username === store.username
            );
            teamSide.current = 1;
            if (!user) {
                teamSide.current = 2;
            }
        }

        client.current?.on("user-published", async (user) => {
            await client.current?.subscribe(user, "audio");
            user.audioTrack?.play();
        });
        client.current?.on("user-joined", async (user) => {
            await client.current?.subscribe(user, "audio");
            user.audioTrack?.play();
        });
        client.current?.on("user-left", async (remoteUser) => {
            setTeams((prev) => {
                prev.team1 = prev.team1.filter(
                    (item) => item.uid !== remoteUser.uid.toString()
                );
                prev.team2 = prev.team2.filter(
                    (item) => item.uid !== remoteUser.uid.toString()
                );
                return { ...prev };
            });
            await client.current?.unsubscribe(remoteUser);
        });

        socket.current?.on("usernameUID", (body: PlayerInterface) => {
            setTeams((prev) => {
                return updateTeams(prev, body.uid, body.username);
            });
        });
        socket.current?.on("newWord", (body: NewWordInterface) => {
            setWord(body.word);
            setAnsweringPlayer(body.player);
            setDisabled(teamSide.current! === body.teamSide);
            setIntervalId(body.intervalId);
            setTimer(30);
        });
        socket.current?.on("gameOver", async (res: GameEndInterface) => {
            try {
                setGameOver(res);
                await client.current?.leave();
                setIntervalId(0);
            } catch (e) {
                console.log(e);
            }
        });
        socket.current?.on("setTimer", async (body: SetTimerInterface) => {
            setTimer(() => {
                if (body.timer === 0) {
                    setWord("Loading...");
                    setDisabled(true);
                }
                return body.timer;
            });
        });
    }, [
        client,
        store.username,
        state.token,
        state.appId,
        store.channelName,
        state,
        timer,
        word,
        answeringPlayer,
        teams.team1,
        intervalId,
        socket
    ]);

    return (
        <div className="absolute gameroom">
            <div
                className="gameEnd-background"
                style={{ display: isGameOver ? "flex" : "none" }}
            >
                <div className="gameEnd-content">
                    <div className="gameEnd-content-header">
                        <p>Game score</p>
                    </div>
                    <div className="gameEnd-content-information">
                        <p>Room id: {isGameOver?.channelName}</p>
                        <p>Number of rounds: {isGameOver?.rounds}</p>
                        <p>Word type: {isGameOver?.wordType}</p>
                    </div>
                    <div className = "gameEnd-content-score">
                        <div className = "gameEnd-content-teams">
                            <ScoreSection team = {isGameOver?.team1} side = "TeamI"/>
                            <ScoreSection team = {isGameOver?.team2} side = "TeamII"/>
                        </div>
                        <div className = "gameEnd-button">
                            <Link to = "/">Go to homepage</Link>
                        </div>
                    </div>
                </div>
            </div>
            <div className="gameroom-content">
                <h1>Game room section</h1>
                <div className="gameroom-player-section">
                    <PlayerArray
                        players={teams.team1}
                        className="border-right"
                    />
                    <div className="gameroom-word">
                        <h3>
                            {
                                answeringPlayer === store.username 
                                ? "Guess the word!!!"
                                : word
                            }
                        </h3>
                        <p>{timer}</p>
                        <button disabled={disabled} onClick={() => gotRight()}>
                            Next round
                        </button>
                    </div>
                    <PlayerArray
                        players={teams.team2}
                        className="border-left"
                    />
                </div>
            </div>
        </div>
    );
};

export default GameRoom;
