import { Socket, Server } from "socket.io";
import { connection } from "mongoose";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import {
    CreateRoomInterface,
    JoinRoomInterface,
    NewUserReadyInterface,
    LeaveRoomInterface
} from "./beforeGame.type";
import { createDocument, findDocument } from "../../services/mongo/mongo";
import { WordInterface } from "../../services/mongo/word";
import { RoomInterface, RoomModel } from "../../services/mongo/room";
import { GameInterface, GameModel } from "../../services/mongo/game";
import { gameLogic } from "../inGame/inGame.service";

enum TeamSide {
    Team1 = "team1",
    Team2 = "team2"
}
interface PlayersAndTokensInterface {
    player: string;
    token: string;
}

const createUid = async (digitCount: number): Promise<string> => {
    let num = "";
    for (let i = 0; i < digitCount; i++) {
        let randomNumber = Math.floor(Math.random() * 9 + 1);
        num += randomNumber;
    }
    return num;
};
const getWords = async (
    length: number,
    wordType: string
): Promise<string[]> => {
    let answer: string[] = [];
    let wordsArr = await connection
        .collection<WordInterface>(wordType)
        .find({})
        .toArray();
    while (answer.length !== length) {
        let randomNumber = Math.floor(Math.random() * wordsArr.length);
        let randomWord = wordsArr[randomNumber];
        if (!answer.includes(randomWord.word)) {
            answer.push(randomWord.word);
            if (answer.length === length) {
                break;
            }
        }
    }
    return answer;
};
const decideSide = async (): Promise<TeamSide> => {
    let result = Math.round(Math.random());
    if (result === 1) {
        return TeamSide.Team1;
    }
    return TeamSide.Team2;
};

const createRoom = async (socket: Socket, body: CreateRoomInterface) => {
    try {
        let getWordsPromise = getWords(body.rounds * 2, body.wordType);
        let channelNamePromise = createUid(9);
        let passwordPromise = createUid(6);
        let [words, channelName, password] = await Promise.all([
            getWordsPromise,
            channelNamePromise,
            passwordPromise
        ]);
        const { username, ...rest } = body;
        let createRoomPromise = createDocument<RoomInterface>(RoomModel, {
            ...rest,
            channelName,
            password,
            words,
            players: [],
            team1: [],
            team2: []
        });
        await socket.join(channelName);
        let room = await createRoomPromise;
        let resBody = {
            channelName,
            password,
            wordType: body.wordType,
            rounds: body.rounds,
            playerCount: room.playerCount
        };
        socket.emit("createRoomResponse", resBody);
    } catch (e) {
        console.log(e);
        socket.emit("createRoomResponse", undefined);
    }
};

const joinRoom = async (socket: Socket, body: JoinRoomInterface) => {
    let room = await findDocument<RoomInterface>(RoomModel, { ...body });
    if (room) {
        await socket.join(room.channelName);
        socket.emit("joinRoomResponse", {
            channelName: room.channelName,
            password: room.password,
            wordType: room.wordType,
            rounds: room.rounds,
            playerCount: room.playerCount
        });
        return;
    }
    socket.emit("notAvailable", "Room is either not created or expired.");
};

const newUserReady = async (
    socket: Socket,
    body: NewUserReadyInterface,
    io: Server
) => {
    const { username, channelName } = body;
    let room = await findDocument<RoomInterface>(RoomModel, { channelName });
    if (!room!.players.includes(username)) {
        room!.players.push(username);
        let result = await decideSide();
        if (room![result].length === Math.floor(room!.playerCount / 2)) {
            if (result === TeamSide.Team1) {
                result = TeamSide.Team2;
            } else {
                result = TeamSide.Team1;
            }
        }
        room![result].push({ username, uid: "" });
    }
    await room!.save();
    socket.emit("newUserReadyRes", room!.players);
    socket.broadcast.to(channelName).emit("newUserJoined", username);
    if (room!.players.length === room!.playerCount) {
        const { team1, team2, rounds, wordType, words } = room!;
        let playersAndTokens: Array<PlayersAndTokensInterface> = [];
        room!.players.forEach((player) => {
            const token = RtcTokenBuilder.buildTokenWithUid(
                process.env.APP_ID!,
                process.env.APP_CERTIFICATE!,
                channelName,
                0,
                RtcRole.PUBLISHER,
                Math.floor(Date.now() / 1000) + 3600
            );
            playersAndTokens.push({ token, player });
        });
        let game = await createDocument<GameInterface>(GameModel, {
            rounds: rounds,
            wordType: wordType,
            team1: team1.map(val => {
                return {
                    username: val.username,
                    gotCorrect: 0,
                    gotWrong: 0
                }
            }),
            team2: team2.map(val => {
                return {
                    username: val.username,
                    gotCorrect: 0,
                    gotWrong: 0
                }
            }),
            channelName, words
        });
        const intervalId = await gameLogic(io, channelName, game, 0, 1, 0);
        io.in(channelName).emit("gameReady", {
            team1,
            team2,
            appId: process.env.APP_ID!,
            playersAndTokens,
            intervalId,
            word: words[0]
        });
    }
};

const leaveRoom = async (socket: Socket, body: LeaveRoomInterface) => {
    try {
        const { channelName, username } = body;
        let room = await findDocument<RoomInterface>(RoomModel, {
            channelName
        });
        room!.players = room!.players.filter((item) => item !== username);
        if (
            room!.team1.findIndex((item) => item.username === username) === -1
        ) {
            room!.team2 = room!.team2.filter(
                (item) => item.username !== username
            );
        } else {
            room!.team1 = room!.team1.filter(
                (item) => item.username !== username
            );
        }
        await room!.save();
        await socket.leave(channelName);
        socket.emit("leftRoom", true);
        socket.broadcast.to(channelName).emit("userLeft", username);
    } catch (e) {
        console.log(e);
        socket.emit("leftRoom", false);
    }
};

export { createRoom, joinRoom, newUserReady, leaveRoom };
