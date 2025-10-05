export interface LoginType {
  message: string;
  email: string;
  id: number;
  userName: string;
  role: "user" | "admin";
}

export interface LoginProps {
  email: string;
  password: string;
}
