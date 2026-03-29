import { Session } from "next-auth";

export interface AuthSession extends Session {
}
// In your user-types file
export type UserSessionRole = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  description: string;
};
