import { Schema, model } from "mongoose";

export interface UserInterface {
    username: string;
    email: string;
    password: string;
    accessTokenId: string;
    refreshTokenId: string;
}

const UserSchema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, requried: true },
    accessTokenId: { type: String, required: true },
    refreshTokenId: { type: String, required: true },
});

const UserModel = model("user", UserSchema);
export default UserModel;