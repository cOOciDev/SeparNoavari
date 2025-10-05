import { AxiosError } from "axios";
import api from "../../../api";
import toast from "react-hot-toast";
import type { LoginProps, LoginType } from "./type";

interface LoginResponse {
  id: number;
  email: string;
  name?: string | null;
  role?: string;
  message?: string;
}

interface ErrorResponse {
  error: string;
}

const Login = async ({ email, password }: LoginProps): Promise<LoginType> => {
  try {
    const response = await api.post<LoginResponse>(
      "login",
      { email, password },
      { withCredentials: true }
    );

    const payload = response.data || ({} as LoginResponse);
    const success: LoginType = {
      message: payload.message || "Login successful.",
      email: payload.email ?? "",
      id: payload.id ?? 0,
      userName: payload.name ?? "",
      role: payload.role === "admin" ? "admin" : "user",
    };

    toast.success(success.message);
    return success;
  } catch (error) {
    const err = error as AxiosError<ErrorResponse>;
    const errorMessage =
      err.response?.data?.error || err.message || "Something went wrong.";

    toast.error(errorMessage);
    return {
      message: errorMessage,
      email: "",
      id: 0,
      userName: "",
      role: "user",
    };
  }
};

export default Login;
