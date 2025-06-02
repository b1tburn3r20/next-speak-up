import prisma from "@/prisma/client";
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

export const assignPermissionToRole = async (
  roleId: number,
  permissionId: number
) => {
  await prisma.rolePermission.create({
    data: {
      roleId: roleId,
      permissionId: permissionId,
    },
  });
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
