export interface CreateRoomInterface {
    rounds: number;
    wordType: string;
    playerCount: number;
    username: string;
}

export interface JoinRoomInterface {
    channelName: string;
    password: string;
}

export interface NewUserReadyInterface {
    username: string;
    channelName: string;
}

export interface LeaveRoomInterface {
    channelName: string;
    username: string;
}