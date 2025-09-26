import { AxiosError } from "axios";
import api from "../../../api";
import toast from "react-hot-toast";
import type { LoginProps, LoginType } from "./type";

interface ErrorResponse {
  error: string;
}

const Login = async ({ email, password }: LoginProps): Promise<LoginType> => {
  try {
    const res = await api.post("login", { email, password }, { withCredentials: true });
    toast.success(res.data?.message || "Login successfully.");
    return res.data;
  } catch (error) {
    const err = error as AxiosError<ErrorResponse>;
    const errorMessage =
      err.response?.data?.error || err.message || "Something went wrong.";
    toast.error(errorMessage);
    return {
      message: errorMessage,
      userEmail: "",
      userId: 0,
      userName: "",
    };
  }
};

export default Login;
