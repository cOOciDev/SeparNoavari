import { AxiosError } from "axios";
import api from "../../../api";
import toast from "react-hot-toast";
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
    const errorMessage =
      err.response?.data?.error || err.message || "Something went wrong.";
    toast.error(errorMessage);
    return { ideas: [] }; // fallback
  }
};

export default MyIdea;
