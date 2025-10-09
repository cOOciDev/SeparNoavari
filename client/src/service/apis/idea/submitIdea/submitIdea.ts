import { AxiosError } from "axios";
import api from "../../../api";
import toast from "react-hot-toast";

export interface SubmitIdeaProps {
  submitter_full_name: string;
  contact_email: string;
  phone?: string;
  track: string;
  idea_title: string;
  executive_summary: string;
  pdf_file: File;
  word_file: File;
  team_members: string[];
}

export interface SubmitIdeaResponse {
  message: string;
  ideaId?: number;
}

interface ErrorResponse {
  error: string;
}

const submitIdea = async (
  data: SubmitIdeaProps
): Promise<SubmitIdeaResponse> => {
  try {
    const form = new FormData();
    form.append("submitter_full_name", data.submitter_full_name);
    form.append("contact_email", data.contact_email);
    form.append("phone", data.phone || "");
    form.append("track", data.track);
    form.append("idea_title", data.idea_title);
    form.append("executive_summary", data.executive_summary);
    data.team_members.forEach((m, i) => form.append(`team_members[${i}]`, m));
    form.append("pdf_file", data.pdf_file);
    form.append("word_file", data.word_file);

    // Do NOT set Content-Type manually; the browser/axios will set the correct
    // multipart/form-data boundary. Setting it manually can trigger preflight
    // or send an incorrect header which leads to network/CORS failures.
    const res = await api.post("submit-idea", form, {
      withCredentials: true, // Ensure session cookie is sent
    });

    toast.success(res.data?.message || "Idea submitted successfully.");
    return res.data;
  } catch (error) {
    const err = error as AxiosError<ErrorResponse>;
    const errorMessage =
      err.response?.data?.error || err.message || "Something went wrong.";
    // If unauthorized, rethrow so calling page can redirect to login
    const status = err.response?.status;
    toast.error(errorMessage);
    if (status === 401 || status === 403) {
      const e: any = new Error(errorMessage);
      e.status = status;
      throw e;
    }
    return { message: errorMessage };
  }
};

export default submitIdea;

