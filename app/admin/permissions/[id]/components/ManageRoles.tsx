"use client";
import { useRolesStore } from "@/app/admin/stores/useRolesStore";
import { useEffect, useState } from "react";
import ManageRoleList from "./ManageRoleList";
import { Permission } from "@prisma/client";

const ManageRoles = () => {
  const setRoles = useRolesStore((store) => store.setRoles);
  const roles = useRolesStore((store) => store.roles);
  const [fetchedPermissions, setFetchedPermissions] = useState<
    Permission[] | null
  >(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchRoles(), fetchPermissions()]);
      } catch (error) {
        console.error("something went wrong...", error);
      }
    };
    fetchData();
  }, []);
  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/admin/roles/get-all-roles");
      const data = await response.json();
      if (response.ok) {
        setRoles(data.roles);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const fetchPermissions = async () => {
    try {
      const response = await fetch(
        "/api/admin/permissions/get-all-permissions"
      );
      const data = await response.json();
      if (response.ok) {
        setFetchedPermissions(data.permissions);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <ManageRoleList allPermissions={fetchedPermissions} roles={roles} />
    </div>
  );
};

export default ManageRoles;
