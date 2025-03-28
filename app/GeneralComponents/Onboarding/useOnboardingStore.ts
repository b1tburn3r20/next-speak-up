// useOnboardingStore.ts
import { create } from "zustand";

interface User {
  username?: string | null;
  state?: string | null;
  ageRange?: string | null;
  householdIncome?: string | null;
}

type OnboardingStore = {
  // states
  currentStep: number;
  isOnboarding: boolean;
  username: string;
  state: string;
  ageRange: string;
  householdIncome: string;
  isInitialized: boolean;
  favoriteCount: number;

  // actions
  setUsername: (username: string) => void;
  setState: (state: string) => void;
  setAgeRange: (ageRange: string) => void;
  setCurrentStep: (currentStep: number) => void;
  setOnboarding: (isOnboarding: boolean) => void;
  setHouseholdIncome: (householdIncome: string) => void;
  setStep: (step: number) => void;
  initializeFromUser: (user: User) => void;
  incrementFavoriteCount: () => void;
};

const initialState = {
  currentStep: 0,
  isOnboarding: false,
  username: "",
  state: "",
  ageRange: "",
  householdIncome: "",
  isInitialized: false,
  favoriteCount: 0,
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  ...initialState,
  // actions
  setUsername: (username: string) => set({ username }),
  setState: (state: string) => set({ state }),
  setAgeRange: (ageRange: string) => set({ ageRange }),
  setCurrentStep: (currentStep: number) => set({ currentStep }),
  setOnboarding: (isOnboarding: boolean) => set({ isOnboarding }),
  setHouseholdIncome: (householdIncome: string) => set({ householdIncome }),
  setStep: (step: number) => set({ currentStep: step }),
  incrementFavoriteCount: () =>
    set((state) => ({ favoriteCount: state.favoriteCount + 1 })),
  initializeFromUser: (user: User) =>
    set((state) => ({
      ...state,
      username: user.username || "",
      state: user.state || "",
      ageRange: user.ageRange || "",
      householdIncome: user.householdIncome || "",
      isInitialized: true,
    })),
}));
