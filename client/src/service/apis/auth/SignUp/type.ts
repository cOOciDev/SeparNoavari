export interface SingUpType {
  message: string;
  userEmail: string;
  userId: number;
  userName: string;
  userRole: "user" | "admin";
}

export interface SingUpProps {
  email: string;
  name: string;
  password: string;
}
