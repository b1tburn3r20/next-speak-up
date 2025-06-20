import prisma from "@/prisma/client";
import { logUserAction } from "./user";
export const checkPermission = async (name: string) => {
  return await prisma.permission.findUnique({
    where: {
      name: name,
    },
  });
};
export const checkRole = async (name: string) => {
  return await prisma.role.findUnique({
    where: {
      name: name,
    },
  });
};

export const createPermission = async (name: string, description: string) => {
  return await prisma.permission.create({
    data: {
      name: name,
      description: description,
    },
  });
};

export const createRole = async (name: string, description: string) => {
  return await prisma.role.create({
    data: {
      name: name,
      description: description,
    },
  });
};

export const getAllRoles = async () => {
  return await prisma.role.findMany();
};

export const getAllPermissions = async () => {
  return await prisma.permission.findMany();
};

export const getRoleData = async (roleId: number) => {
  return await prisma.role.findUnique({
    where: {
      id: roleId,
    },
    // i had to add this to get the permissions because its not strictly in that model, had to include its foriegn key
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });
};

// Get user's role
export const getUserRole = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      role: true,
    },
  });

  return user?.role || null;
};

// Check if user has a specific permission
export const userHasPermission = async (
  userId: string,
  permissionName: string
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!user?.role) return false;

  return user.role.permissions.some(
    (rolePermission) => rolePermission.permission.name === permissionName
  );
};

// Get user with full role and permission data
export const getUserWithPermissions = async (userId: string) => {
  return await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });
};

export const assignPermissionToRole = async (
  roleId: number,
  permissionId: number,
  actionTakerId: string,
  actionTakerRole: string
) => {
  await prisma.rolePermission.create({
    data: {
      roleId: roleId,
      permissionId: permissionId,
    },
  });
  await logUserAction(
    actionTakerId,
    "assignPermissionToRole",
    `${permissionId} assigned to ${roleId}`,
    actionTakerRole
  );
  return getRoleData(roleId);
};

export const removePermissionFromRole = async (
  roleId: number,
  permissionId: number
) => {
  await prisma.rolePermission.delete({
    where: {
      roleId_permissionId: {
        roleId: roleId,
        permissionId: permissionId,
      },
    },
  });
  return getRoleData(roleId);
};
export const roleHasPermission = async (
  roleId: number,
  permissionId: number
) => {
  const existing = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId: roleId,
        permissionId: permissionId,
      },
    },
  });
  return existing !== null;
};
export const changeUserRole = async (
  userId: string,
  roleId: number | null,
  adminUserId: string,
  role: string
) => {
  const result = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      roleId: roleId,
    },
    include: {
      role: true,
    },
  });

  // Log the admin's action with the target user as entityId
  await logUserAction(adminUserId, "change_user_role", userId, role);

  return result;
};
