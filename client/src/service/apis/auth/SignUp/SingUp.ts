import { AxiosError } from "axios";
import api from "../../../api";
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
    const payload = res.data as SingUpType | null;
    if (!payload?.ok || !payload.user) {
      throw new Error("Invalid signup response");
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

export default SignUp;
