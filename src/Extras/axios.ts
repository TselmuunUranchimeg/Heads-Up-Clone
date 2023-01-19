import axios from "axios";

const axiosIns = axios.create({
    baseURL: "https://heads-up-clone-server.onrender.com",
    withCredentials: true,
});

export default axiosIns;