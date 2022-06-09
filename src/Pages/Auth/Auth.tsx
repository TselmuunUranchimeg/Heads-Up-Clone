import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { InitialState } from "../../Extras/store";
import Register from "./Register/Register";
import Login from "./Login/Login";

const Auth = () => {
    const store = useSelector<InitialState, InitialState>(state => state);

    if (store.accessToken !== "" && store.username !== "") {
        return <Navigate to = "/" />
    }

    return (
        <Routes>
            <Route path = "register" element = {<Register />} />
            <Route path = "login" element = {<Login />} />
            <Route path = "*" element = {<Navigate to = "/" />} />
        </Routes>
    )
}

export default Auth;