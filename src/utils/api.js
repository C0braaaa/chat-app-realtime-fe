import axios from "axios";

const API_URL = "http://10.1.1.39:3000/v1/";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
