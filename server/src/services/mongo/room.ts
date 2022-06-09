import { Schema, model } from "mongoose";

interface PlayerInterface {
    username: string;
    uid: string;
}
interface RoomInterface {
    rounds: number;
    channelName: string;
    wordType: string,
    playerCount: number;
    words: string[];
    password: string;
    players: string[];
    team1: PlayerInterface[];
    team2: PlayerInterface[];
}

const RoomSchema = new Schema({
    rounds: { type: Number, required: true },
    channelName: { type: String, required: true },
    wordType: { type: String, required: true },
    playerCount: { type: Number, required: true },
    words: [{ type: String, required: true }],
    password: { type: String, required: true },
    expireAt: { type: Date, default: Date.now, index: { expireAfterSeconds: 1200 } },
    players: [{ type: String, required: true }],
    team1: [{ username: String, uid: String }],
    team2: [{ username: String, uid: String }],
});

const RoomModel = model("room", RoomSchema);
export { RoomModel, RoomInterface, PlayerInterface };