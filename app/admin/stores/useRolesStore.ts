import { Role, Permission, RolePermission } from "@prisma/client";
import { create } from "zustand";

export type RolesStore = {
  roles: Role[];
  setRoles: (data: FullRole[]) => void;
  //
  userRole: string;
  setUserRole: (data: string) => void;
};
export type FullRole = Role & {
  permissions: RolePermission[];
};
export const useRolesStore = create<RolesStore>((set) => ({
  roles: [],
  userRole: "",

  setUserRole: (data: string) => set({ userRole: data }),
  setRoles: (data: FullRole[]) => set({ roles: data }),
}));
