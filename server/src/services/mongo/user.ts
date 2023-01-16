import { Schema, model } from "mongoose";

export interface UserInterface {
    username: string;
    email: string;
    password: string;
}

const UserSchema = new Schema<UserInterface>({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, requried: true }
});

const UserModel = model<UserInterface>("user", UserSchema);
export default UserModel;