export interface SingUpType {
  ok: boolean;
  user?: {
    id: number | string;
    email: string;
    name?: string;
    role?: "user" | "admin" | "judge";
  };
}

export interface SingUpProps {
  email: string;
  name: string;
  password: string;
}
