import axios from "axios";
import i18n from "../AppData/i18n";
import { logoutAndRedirect } from "../utils/session";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers["Accept-Language"] = i18n.language || "fa";
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response?.data?.ok === false) {
      const error: any = new Error(response.data?.message || "Request failed");
      error.code = response.data?.code;
      error.details = response.data?.details;
      throw error;
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || "";

    if (
      (status === 401 || status === 419) &&
      requestUrl.includes("/auth/me")
    ) {
      logoutAndRedirect();
    }

    return Promise.reject(error);
  }
);

export default api;

