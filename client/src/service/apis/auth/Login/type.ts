export interface LoginType {
  ok: boolean;
  user?: {
    id: number | string;
    email: string;
    name?: string;
    role?: "user" | "admin" | "judge";
  };
}

export interface LoginProps {
  email: string;
  password: string;
}
