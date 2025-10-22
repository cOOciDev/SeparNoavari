import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createIdea,
  getIdea,
  getMyIdeas,
} from "../apis/ideas.api";

type MyIdeasResult = Awaited<ReturnType<typeof getMyIdeas>>;

export const useMyIdeas = (enabled = true) =>
  useQuery<MyIdeasResult>({
    queryKey: ["ideas", "mine"],
    queryFn: getMyIdeas,
    enabled,
  });

export const useIdea = (id?: string | null) =>
  useQuery({
    queryKey: ["idea", id ?? ""],
    queryFn: () => getIdea(id || ""),
    enabled: Boolean(id),
  });

export const useCreateIdea = () => {
  return useMutation({
    mutationFn: (formData: FormData) => createIdea(formData),
  });
};

export default {
  useMyIdeas,
  useIdea,
  useCreateIdea,
};
