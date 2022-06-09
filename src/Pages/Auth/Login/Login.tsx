import { ChangeEvent, FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import axiosIns from "../../../Extras/axios";
import { set } from "../../../Extras/socket";
import { InitialState, updateState } from "../../../Extras/store";

interface FormInterface {
    email: string;
    password: string;
}
enum FieldKey {
    Email = "email",
    Password = "password",
}

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const store = useSelector<InitialState, InitialState>(state => state);
    const [form, setForm] = useState<FormInterface>({
        email: "",
        password: "",
    });

    const updateValue = (e: ChangeEvent<HTMLInputElement>, key: FieldKey) => {
        setForm(prev => {
            return {...prev, [key]: e.target.value};
        });
    }
    const submitForm = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        axiosIns.post("/auth/login", form).then(res => {
            if (res.status === 200) {
                dispatch(updateState({
                    ...store,
                    username: res.data.username,
                    email: res.data.email,
                    accessToken: res.headers["authorization"],
                }));
                set();
                alert("Successfully logged in!!!");
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
                navigate("/", { replace: true });
            }
        }).catch((e) => {
            if (axios.isAxiosError(e)) {
                alert(e.response?.data);
                setForm({
                    email: "",
                    password: "",
                });
            }
        });
    }

    return (
        <div className="absolute form-background">
            <form className="form login-form" onSubmit = {e => submitForm(e)}>
                <h1 className = "form-h1">Login</h1>
                <input
                    required
                    type="email"
                    placeholder="Your email"
                    className="form-input"
                    onChange = {e => updateValue(e, FieldKey.Email)}
                    value = { form.email }
                />
                <input
                    required
                    type="password"
                    placeholder="Your password"
                    className="form-input"
                    value = { form.password }
                    onChange = {e => updateValue(e, FieldKey.Password)}
                />
                <button type="submit" className="form-button">
                    Log in
                </button>
                <p className = "form-p">or</p>
                <Link className="form-a" to="/auth/register">
                    Register
                </Link>
                <Link className="form-a" to="/">
                    Go to homepage
                </Link>
            </form>
        </div>
    );
};

export default Login;
