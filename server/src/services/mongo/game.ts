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
    createdAt?: Date;
}

const GameSchema = new Schema<GameInterface>({
    rounds: { type: Number },
    wordType: { type: String },
    team1: [{ username: String, gotCorrect: Number, gotWrong: Number, _id: false }],
    team2: [{ username: String, gotCorrect: Number, gotWrong: Number, _id: false }],
    channelName: { type: String },
    words: [String],
    createdAt: { type: Date, expires: 1200, default: Date.now }
});
GameSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1200 });

const GameModel = model<GameInterface>("game", GameSchema);
export { GameModel };
