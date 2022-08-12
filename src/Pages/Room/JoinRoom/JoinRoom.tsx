import { useState, useRef, useEffect, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Socket } from "socket.io-client";
import { get } from "../../../Extras/socket";
import { InitialState, updateState } from "../../../Extras/store";

interface JoinRoomInterface {
    channelName: string;
    password: string;
}

const JoinRoom = () => {
    const [values, setValues] = useState<JoinRoomInterface>({
        channelName: "",
        password: ""
    });
    const socket = useRef<Socket>();
    const navigate = useNavigate();
    const store = useSelector<InitialState, InitialState>((state) => state);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!socket.current) socket.current = get();

        socket.current.off().on("joinRoomResponse", (res: undefined | any) => {
            if (typeof res === "undefined") {
                alert(
                    "Something went wrong with the server, please try again later!!!"
                );
                navigate("/");
                return;
            }
            const { channelName, ...rest } = res;
            dispatch(updateState({ ...store, channelName }));
            navigate("/room/wait", {
                state: rest
            });
            socket.current?.emit("newUserReady", { 
                channelName, 
                username: store.username
            });
        });
    }, [navigate, socket, store.username, dispatch, store]);

    const submitForm = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        socket.current?.emit("joinRoom", { ...values, username: store.username });
    };

    return (
        <div className="absolute form-background">
            <form className="form" onSubmit={(e) => submitForm(e)}>
                <h1 className="form-h1">Join room</h1>
                <input
                    className="form-input"
                    type="text"
                    placeholder="Room id"
                    value={values.channelName}
                    onChange={(e) =>
                        setValues((prev) => {
                            return { ...prev, channelName: e.target.value };
                        })
                    }
                    required
                />
                <input
                    className="form-input"
                    type="password"
                    placeholder="Password"
                    value={values.password}
                    onChange={(e) =>
                        setValues((prev) => {
                            return { ...prev, password: e.target.value };
                        })
                    }
                    required
                />
                <button className="form-button" type="submit">
                    Join room
                </button>
                <p className="form-p">or</p>
                <Link to="/" className="form-a">
                    Go to homepage
                </Link>
            </form>
        </div>
    );
};

export default JoinRoom;
