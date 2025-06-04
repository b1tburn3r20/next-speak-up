"use client";
import { useRolesStore } from "@/app/admin/stores/useRolesStore";
import { useEffect, useState } from "react";
import ManageRoleList from "./ManageRoleList";
import { Permission } from "@prisma/client";
import LoadingCatch from "@/app/GeneralComponents/Onboarding/components/LoadingCatch";

const ManageRoles = () => {
  const setRoles = useRolesStore((store) => store.setRoles);
  const roles = useRolesStore((store) => store.roles);
  const [loading, setLoading] = useState(true);
  const [fetchedPermissions, setFetchedPermissions] = useState<
    Permission[] | null
  >(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchRoles(), fetchPermissions()]);
      } catch (error) {
        console.error("something went wrong...", error);
      } finally {
        setLoading(false);
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
  if (loading) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <LoadingCatch />
      </div>
    );
  }

  return (
    <div>
      <ManageRoleList allPermissions={fetchedPermissions} roles={roles} />
    </div>
  );
};

export default ManageRoles;
