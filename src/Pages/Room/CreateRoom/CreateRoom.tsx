import { useEffect, useState, useRef, FormEvent } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import axiosIns from "../../../Extras/axios";
import { get } from "../../../Extras/socket";
import { InitialState, updateState } from "../../../Extras/store";
import "./CreateRoom.css";
import { Socket } from "socket.io-client";

interface CreateRoomInterface {
    rounds: number;
    wordType: string;
    playerCount: number;
    username: string;
}

const CreateRoom = () => {
    const navigate = useNavigate();
    const [options, setOptions] = useState<Array<string>>([]);
    const store = useSelector<InitialState, InitialState>((state) => state);
    const [values, setValues] = useState<CreateRoomInterface>({
        rounds: 0,
        wordType: "",
        playerCount: 0,
        username: store.username
    });
    const socket = useRef<Socket>();
    const dispatch = useDispatch();

    useEffect(() => {
        if (!socket.current) socket.current = get();

        socket.current?.off().on(
            "createRoomResponse",
            async (res: undefined | any) => {
                if (typeof res === "undefined") {
                    alert(
                        "Something went wrong with the server, please try again later!!!"
                    );
                    navigate("/");
                    return;
                }
                const { channelName, ...rest } = res;
                dispatch(updateState({ ...store, channelName }));
                navigate("/room/wait", { state: rest });
                socket.current?.emit("newUserReady", {
                    channelName: channelName,
                    username: store.username
                });
            }
        );
    }, [navigate, store.accessToken, socket, store.username, dispatch, store]);

    const submitForm = async (e: FormEvent) => {
        e.preventDefault();
        if (values.wordType !== "Select") {
            socket.current?.emit("createRoom", values);
        }
    };
    const getOptions = () => {
        if (options.length === 0) {
            axiosIns
                .get("/room/getOptions", {
                    headers: {
                        authorization: store.accessToken
                    }
                })
                .then((res) => {
                    setOptions(res.data);
                })
                .catch((e) => {
                    if (axios.isAxiosError(e)) {
                        alert(
                            "Something went wrong with the server, please try again later!"
                        );
                        navigate("/");
                    }
                });
        }
    }

    return (
        <div className="absolute form-background">
            <Helmet>
                <title>Create a room - Heads Up Clone</title>
            </Helmet>
            <form className="form" onSubmit={async (e) => await submitForm(e)}>
                <h1 className="form-h1">Create room</h1>
                <div className="createRoom-div">
                    <label>Number of rounds</label>
                    <input
                        required
                        type="number"
                        min={1}
                        max={10}
                        value={values.rounds}
                        onChange={(e) =>
                            setValues((prev) => {
                                return {
                                    ...prev,
                                    rounds: parseInt(e.target.value)
                                };
                            })
                        }
                    />
                </div>
                <div className="createRoom-div">
                    <label>Player count (2-8)</label>
                    <input
                        required
                        type="number"
                        value={values.playerCount}
                        min={2}
                        max={8}
                        step={2}
                        onChange={(e) =>
                            setValues((prev) => {
                                return {
                                    ...prev,
                                    playerCount: parseInt(e.target.value)
                                };
                            })
                        }
                    />
                </div>
                <div className="createRoom-div">
                    <label>Select word type</label>
                    <select
                        onChange={(e) =>
                            setValues((prev) => {
                                return { ...prev, wordType: e.target.value };
                            })
                        }
                        onClick = {() => {getOptions()}}
                    >
                        <option>Select</option>
                        {options.map((value, index) => {
                            return (
                                <option key={index} value={value}>
                                    {value}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <button className="form-button" type="submit">
                    Create room
                </button>
                <p className="form-p">or</p>
                <Link to="/" className="form-a">
                    Go to homepage
                </Link>
            </form>
        </div>
    );
};

export default CreateRoom;
