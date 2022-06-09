import { model, Schema } from "mongoose";

export interface GamePlayerInterface {
    username: string;
    gotCorrect: number;
    gotWrong: number;
}
export interface GameInterface {
    rounds: number;
    wordType: string;
    team1: GamePlayerInterface[];
    team2: GamePlayerInterface[];
    channelName: string;
    words: string[];
}

const GameSchema = new Schema({
    expireAt: { type: Date, default: Date.now, index: { expireAfterSeconds: 1200 }},
    rounds: { type: Number },
    wordType: { type: String },
    team1: [{ username: String, gotCorrect: Number, gotWrong: Number, _id: false }],
    team2: [{ username: String, gotCorrect: Number, gotWrong: Number, _id: false }],
    channelName: { type: String },
    words: [String]
});

const GameModel = model("game", GameSchema);
export { GameModel };
