import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5501/api/",
  headers: {
    "Accept-Language": "en-US",
  },
  withCredentials: true,
});

export default api;
