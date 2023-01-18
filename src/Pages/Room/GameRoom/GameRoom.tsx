import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
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
interface StateInterface {
    appId: string;
    token: string;
    team1: PlayerInterface[];
    team2: PlayerInterface[];
    intervalId: number;
    word: string;
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
interface PlayerArrayInterface {
    team: PlayerInterface[];
    borderSide: string;
}
interface PlayerTabInterface {
    user: PlayerInterface;
}

const PlayerTab = ({ user }: PlayerTabInterface) => {
    return (
        <div className = "player" id = { user.uid }>
            <div>
                <p>{ user.username }</p>
            </div>
        </div>
    )
}
const PlayerArray = ({ team, borderSide }: PlayerArrayInterface) => {
    return (
        <div className = {`player-array ${ borderSide }`}>
            {team.map((val, ind) => {
                return (
                    <PlayerTab user = { val } key = { ind } />
                )
            })}
        </div>
    )
}
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
    const [word, setWord] = useState(state.word);
    const [disabled, setDisabled] = useState(state.team1[0].username === store.username);
    const [timer, setTimer] = useState(30);
    const [answeringPlayer, setAnsweringPlayer] = useState(state.team1[0].username);
    const [intervalId, setIntervalId] = useState(state.intervalId);
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
                        const video = await AgoraRTC.createCameraVideoTrack();
                        video.play(uid.toString());
                        socket.current?.emit("exchangeUID", {
                            uid: uid.toString(),
                            username: store.username,
                            channelName: store.channelName
                        });
                        let track = 
                            await AgoraRTC.createMicrophoneAndCameraTracks();
                        await client.current?.publish(track);
                        client.current?.remoteUsers.forEach(async (user) => {
                            const
                                audio = client.current!.subscribe(user, "audio"),
                                video = client.current!.subscribe(user, "video");
                            await Promise.all([audio, video]);
                            user.audioTrack?.play();
                            user.videoTrack?.play(user.uid.toString());
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
            const
                audio = client.current!.subscribe(user, "audio"),
                video = client.current!.subscribe(user, "video");
            await Promise.all([audio, video]);
            user.audioTrack?.play();
            user.videoTrack?.play(user.uid.toString());
        });
        client.current?.on("user-joined", async (user) => {
            const
                audio = client.current!.subscribe(user, "audio"),
                video = client.current!.subscribe(user, "video");
            await Promise.all([audio, video]);
            user.audioTrack?.play();
            user.videoTrack?.play(user.uid.toString());
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
            <Helmet>
                <title>In a game - Heads Up Clone</title>
            </Helmet>
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
                    {/* Player array */}
                    <PlayerArray 
                        team = { teams.team1 }
                        borderSide = "border-right"
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
                    {/* Player array */}
                    <PlayerArray 
                        team = { teams.team2 }
                        borderSide = "border-left"
                    />
                </div>
            </div>
        </div>
    );
};

export default GameRoom;
