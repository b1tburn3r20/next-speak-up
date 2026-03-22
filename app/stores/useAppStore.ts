import { create } from "zustand"

type AppStore = {
  isMobile: boolean
  setIsMobile: (data: boolean) => void
}
const initialState = {
  isMobile: false
}
export const useAppStore = create<AppStore>((set) => ({
  ...initialState,
  setIsMobile: (data: boolean) => set({ isMobile: data })
}))
