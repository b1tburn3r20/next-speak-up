import { Role, Permission, RolePermission } from "@prisma/client";
import { create } from "zustand";

export type RolesStore = {
  roles: Role[];
  setRoles: (data: FullRole[]) => void;
};
export type FullRole = Role & {
  permissions: RolePermission[];
};
export const useRolesStore = create<RolesStore>((set) => ({
  roles: [],
  setRoles: (data: FullRole[]) => set({ roles: data }),
}));
