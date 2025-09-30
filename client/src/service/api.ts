import axios from "axios";

const apiHost = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5501").replace(/\/$/, "");

const api = axios.create({
  baseURL: `${apiHost}/api`,
  headers: {
    "Accept-Language": "en-US",
  },
  withCredentials: true,
});

export default api;
