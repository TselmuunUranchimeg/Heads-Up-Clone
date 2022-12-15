import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import "./App.css";
import Background from "./Extras/Components/Background/Background";
import Homepage from "./Pages/Homepage/Homepage";
import Room from "./Pages/Room/Room";
import Auth from "./Pages/Auth/Auth";
import axiosIns from "./Extras/axios";
import { set } from "./Extras/socket";
import { updateState } from "./Extras/store";

function App() {
    const dispatch = useDispatch();
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        axiosIns.get("/auth/verify")
            .then(res => {
                if (res.status === 200) {
                    dispatch(updateState({
                        username: res.data.username,
                        email: res.data.email,
                        accessToken: res.headers["authorization"] as string,
                        channelName: ""
                    }));
                    set();
                    setInterval(() => {
                        axiosIns.get("/auth/verify").then(res => {
                            if (res.status === 200) {
                                dispatch(updateState({
                                    username: res.data.username,
                                    email: res.data.email,
                                    accessToken: res.headers["authorization"] as string,
                                    channelName: ""
                                }));
                            }
                        });
                    }, 1000*840);
                }
                setLoading(false);
            })
            .catch(e => {
                if (axios.isAxiosError(e)) {
                    if (e.response?.status! >= 400) {
                        alert("You are not logged in!!!");
                    } else if (e.response?.status! >= 500) {
                        alert("Something went wrong with the server, please try again later!!!");
                    }
                    setLoading(false);
                }
            });
    }, [dispatch]);

    return (
        <>
            {
                isLoading
                ? (
                    <div className = "loading">
                        <CircularProgress style = {{ color: "white" }}/>
                    </div>
                )
                : (
                    <Router>
                        <Background />
                        <Routes>
                            <Route path = "room/*" element = {<Room />} />
                            <Route path="auth/*" element={<Auth />} />
                            <Route path = "*" element = {<Navigate to = "/" replace />} />
                            <Route path="/" element={<Homepage />} />
                        </Routes>
                    </Router>
                )
            }
        </>
    );
}

export default App;
