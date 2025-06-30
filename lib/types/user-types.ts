export type UserSession = {
  name: string;
  email: string;
  image: string;
  id: string;
  username: string | null;
  state: string | null;
  ageRange: string | null;
  householdIncome: string | null;
  needsOnboarding: boolean;
  role: UserSessionRole;
};
export type AuthSession = {
  user: UserSession;
};
// In your user-types file
export type UserSessionRole = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  description: string;
};
