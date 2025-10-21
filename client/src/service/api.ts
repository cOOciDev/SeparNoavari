import axios from "axios";
import { API_BASE_URL } from "./http";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Accept-Language": "en-US",
  },
  withCredentials: true,
});

export default api;

