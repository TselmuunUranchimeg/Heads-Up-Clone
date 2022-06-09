import { createSlice, configureStore, PayloadAction } from "@reduxjs/toolkit";

export interface InitialState {
    accessToken: string;
    username: string;
    email: string;
    channelName: string;
}

const initialState: InitialState = {
    accessToken: "",
    username: "",
    email: "",
    channelName: ""
};

const slice = createSlice({
    name: "store",
    initialState,
    reducers: {
        updateState: (_, action: PayloadAction<InitialState>) => {
            return action.payload;
        }
    },
});

export const { updateState } = slice.actions;
export const store = configureStore({ reducer: slice.reducer });