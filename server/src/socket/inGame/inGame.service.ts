import { Socket, Server } from "socket.io";
import { Document } from "mongoose";
import { ExchangeUIDInterface, NextWordInterface } from "./inGame.type";
import { saveCount } from "../../services/redis/redis";
import { findDocument, createDocument } from "../../services/mongo/mongo";
import { RoomModel, RoomInterface } from "../../services/mongo/room";
import {
    GameModel,
    GameInterface,
    GamePlayerInterface
} from "../../services/mongo/game";

const gameLogic = async (
    io: Server,
    channelName: string,
    game: Document & GameInterface,
    wordIndex: number,
    teamSide: 1 | 2,
    playerIndex: number
) => {
    let timer = 30;
    let intervalId = setInterval(async () => {
        timer -= 1;
        io.in(channelName).emit("setTimer", { timer });
        if (timer === 0) {
            game[`team${teamSide}`][playerIndex].gotWrong += 1;
            await game.save();
            clearInterval(intervalId);
            if (wordIndex === game.words.length - 1) {
                const { _id, __v, id, ...rest } = game.toJSON();
                io.in(channelName).emit("gameOver", rest);
                return;
            }
            wordIndex += 1;
            if (teamSide === 2) {
                playerIndex += 1;
            }
            teamSide = teamSide === 1 ? 2 : 1;
            if (playerIndex >= game[`team${teamSide}`].length) {
                playerIndex = 0;
            }
            let newIntervalId = await gameLogic(
                io,
                channelName,
                game,
                wordIndex,
                teamSide,
                playerIndex
            );
            io.in(channelName).emit("newWord", {
                teamSide,
                intervalId: newIntervalId,
                word: game.words[wordIndex],
                player: game[`team${teamSide}`][playerIndex].username
            });
        }
    }, 1000);
    return intervalId[Symbol.toPrimitive]();
};

const exchangeUID = async (
    socket: Socket,
    body: ExchangeUIDInterface,
    io: Server
) => {
    try {
        const { channelName, ...rest } = body;
        socket.broadcast.to(channelName).emit("usernameUID", rest);
        let value = await saveCount(channelName);
        let room = await findDocument<RoomInterface>(RoomModel, {
            channelName
        });
        if (value === room!.playerCount) {
            let game = await createDocument<GameInterface>(GameModel, {
                rounds: room!.rounds,
                wordType: room!.wordType,
                team1: room!.team1.map<GamePlayerInterface>((value) => {
                    return {
                        username: value.username,
                        gotCorrect: 0,
                        gotWrong: 0
                    };
                }),
                team2: room!.team2.map<GamePlayerInterface>((value) => {
                    return {
                        username: value.username,
                        gotCorrect: 0,
                        gotWrong: 0
                    };
                }),
                channelName: body.channelName,
                words: room!.words
            });
            let intervalId = await gameLogic(io, channelName, game, 0, 1, 0);
            io.in(channelName).emit("newWord", {
                intervalId,
                word: room!.words[0],
                teamSide: 1,
                player: room!.team1[0].username
            });
        }
    } catch (e) {
        console.log(e);
    }
};

const nextWord = async (body: NextWordInterface, io: Server) => {
    clearInterval(body.intervalId);
    let game = await findDocument<GameInterface>(GameModel, {
        channelName: body.channelName
    });
    let wordIndex = game!.words.findIndex((item) => item === body.word);
    let answeringTeamSide: 1 | 2 = body.teamSide === 1 ? 2 : 1;
    let playerIndex = game![`team${answeringTeamSide}`].findIndex(
        (item) => item.username === body.username
    );
    game![`team${answeringTeamSide}`][playerIndex].gotCorrect += 1;
    await game!.save();
    if (answeringTeamSide === 2) {
        playerIndex += 1;
    }
    if (playerIndex >= game![`team${body.teamSide}`].length) {
        playerIndex = 0;
    }
    wordIndex += 1;
    if (wordIndex === game!.words.length) {
        const { _id, __v, id, ...rest } = game!.toJSON();
        io.in(body.channelName).emit("gameOver", rest);
        return;
    }
    let intervalId = await gameLogic(
        io,
        body.channelName,
        game!,
        wordIndex,
        body.teamSide,
        playerIndex
    );
    io.in(body.channelName).emit("newWord", {
        intervalId,
        teamSide: body.teamSide,
        word: game!.words[wordIndex],
        player: game![`team${body.teamSide}`][playerIndex].username
    });
};

export { exchangeUID, nextWord };
