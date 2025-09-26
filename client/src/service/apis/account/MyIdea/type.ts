export interface FirstMyIdeaType {
  id: number;
  user_id: number;
  contact_email: string;
  submitter_full_name: string;
  track: string;
  phone: string;
  team_members: string | string[] | Record<string, unknown>;
  idea_title: string;
  executive_summary: string;
  file_path: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface MyIdeaType {
  ideas: FirstMyIdeaType[];
}
