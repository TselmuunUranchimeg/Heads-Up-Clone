import { useState, ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import axiosIns from "../../../Extras/axios";
import { set } from "../../../Extras/socket";
import { InitialState, updateState } from "../../../Extras/store";

interface ValuesInterface {
    email: string;
    password: string;
    username: string;
}
enum ValuesEnum {
    Email = "email",
    Password = "password",
    Username = "username",
}

const Register = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const store = useSelector<InitialState, InitialState>(state => state);
    const [values, setValues] = useState<ValuesInterface>({
        email: "",
        username: "",
        password: "",
    });

    const changeValue = (e: ChangeEvent<HTMLInputElement>, key: ValuesEnum) => {
        setValues(prev => {
            return {...prev, [key]: e.target.value};
        });
    }
    const submitForm = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        axiosIns.post("/auth/register", values).then(res => {
            if (res.status === 200) {
                dispatch(updateState({
                    ...store,
                    username: res.data.username,
                    email: res.data.email,
                    accessToken: res.headers["authorization"],
                }));
                set();
                alert("Successfully registered!!!");
                setInterval(() => {
                    axiosIns.get("/auth/verify").then(res => {
                        if (res.status === 200) {
                            dispatch(updateState({
                                username: res.data.username,
                                email: res.data.email,
                                accessToken: res.headers["authorization"],
                                channelName: ""
                            }));
                        }
                    });
                }, 1000*840);
                navigate("/");
            }
        }).catch(e => {
            if (axios.isAxiosError(e)) {
                alert(e.response?.data);
                setValues({
                    email: "",
                    username: "",
                    password: "",
                });
            }
        });
    }

    return (
        <div className="absolute form-background">
            <form className="form" onSubmit = {e => submitForm(e)}>
                <h1 className="form-h1">Register</h1>
                <input
                    required
                    className="form-input"
                    type="email"
                    placeholder="Your email"
                    value = { values.email }
                    onChange = {e => changeValue(e, ValuesEnum.Email)}
                />
                <input
                    required
                    className="form-input"
                    type="text"
                    placeholder="Your username"
                    value = { values.username }
                    onChange = {e => changeValue(e, ValuesEnum.Username)}
                />
                <input
                    required
                    className="form-input"
                    type="password"
                    placeholder="Your password"
                    value = { values.password }
                    onChange = {e => changeValue(e, ValuesEnum.Password)}
                />
                <button className="form-button">Register</button>
                <p className="form-p">or</p>
                <Link className="form-a" to="/auth/login">
                    Log in
                </Link>
                <Link className="form-a" to="/">
                    Go to homepage
                </Link>
            </form>
        </div>
    );
};

export default Register;
