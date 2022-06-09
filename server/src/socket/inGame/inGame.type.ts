export interface ExchangeUIDInterface {
    uid: string;
    username: string;
    channelName: string;
}

export interface NextWordInterface {
    teamSide: 1 | 2;
    username: string;
    word: string;
    channelName: string;
    intervalId: number;
}