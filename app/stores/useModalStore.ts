import { create } from "zustand"

export type ModalStore = {
  isDistrictModalOpen: boolean
  setIsDistrictModalOpen: (data: boolean) => void
}


const initialState = {
  isDistrictModalOpen: false
}

export const useModalStore = create<ModalStore>((set) => ({
  ...initialState,
  setIsDistrictModalOpen: (data) => set({ isDistrictModalOpen: data })
}))
