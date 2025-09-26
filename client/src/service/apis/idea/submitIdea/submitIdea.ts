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
  file?: File | null;
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
    if (data.file) form.append("file", data.file);

    const res = await api.post("submit-idea", form, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true, // Ensure session cookie is sent
    });

    toast.success(res.data?.message || "Idea submitted successfully.");
    return res.data;
  } catch (error) {
    const err = error as AxiosError<ErrorResponse>;
    const errorMessage =
      err.response?.data?.error || err.message || "Something went wrong.";
    toast.error(errorMessage);
    return { message: errorMessage };
  }
};

export default submitIdea;
