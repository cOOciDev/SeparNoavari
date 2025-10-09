import { AxiosError } from "axios";
import api from "../../../api";
import type { LoginProps, LoginType } from "./type";

interface LoginResponse {
  ok: boolean;
  user?: {
    id: number | string;
    email: string;
    name?: string;
    role?: string;
  };
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

    const payload = response.data || { ok: false };
    if (!payload.ok || !payload.user) {
      throw new Error("Invalid login response");
    }
    const role = payload.user.role;
    return {
      ok: true,
      user: {
        id: payload.user.id,
        email: payload.user.email,
        name: payload.user.name ?? "",
        role: role === "admin" ? "admin" : role === "judge" ? "judge" : "user",
      },
    };
  } catch (error) {
    const err = error as AxiosError<ErrorResponse>;
    const errorMessage =
      err.response?.data?.error || err.message || "Something went wrong.";

    const authError: any = new Error(errorMessage);
    authError.status = err.response?.status;
    throw authError;
  }
};

export default Login;
