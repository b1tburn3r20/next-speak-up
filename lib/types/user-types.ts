import { Session } from "next-auth";

export type AuthSession = Session;
// In your user-types file
export type UserSessionRole = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  description: string;
};
