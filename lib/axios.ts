import axios from "axios";

const api = axios.create({
    baseURL: process.env.backendHost,
    headers: {
    "Content-Type": "application/json",
    }, 
});

export default api;