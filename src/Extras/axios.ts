import axios from "axios";

const axiosIns = axios.create({
    baseURL: "http://localhost:8000",
    withCredentials: true,
});

export default axiosIns;