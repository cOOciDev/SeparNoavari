import { AxiosError } from "axios";
import api from "../../../api";
import toast from "react-hot-toast";
import type { SingUpProps, SingUpType } from "./type";

interface ErrorResponse {
  error: string;
}

const SignUp = async ({
  email,
  password,
  name,
}: SingUpProps): Promise<SingUpType> => {
  try {
    const res = await api.post("signup", { email, password, name }, { withCredentials: true });
    toast.success(res.data?.message || "Signed up successfully.");
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

export default SignUp;
