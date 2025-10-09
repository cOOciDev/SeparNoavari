import { AxiosError } from "axios";
import api from "../../../api";
import type { MyIdeaType } from "./type";

interface ErrorResponse {
  error: string;
}

const MyIdea = async (): Promise<MyIdeaType> => {
  try {
    const res = await api.get("user-ideas", { withCredentials: true });
    return res.data; // should match MyIdeaType
  } catch (error) {
    const err = error as AxiosError<ErrorResponse>;
    const authError: any = new Error(
      err.response?.data?.error || err.message || "Something went wrong."
    );
    authError.status = err.response?.status;
    throw authError;
  }
};

export default MyIdea;
