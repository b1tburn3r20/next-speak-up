"use client";
import { useRolesStore } from "@/app/admin/stores/useRolesStore";
import LoadingCatch from "@/app/GeneralComponents/Onboarding/components/LoadingCatch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Role, User } from "@prisma/client";
import { Check, Plus, Replace } from "lucide-react";
import { useEffect, useState } from "react";
const UserRole = ({ user }: { user: User }) => {
  const userRole = useRolesStore((store) => store.userRole);
  const setUserRole = useRolesStore((store) => store.setUserRole);
  const setRoles = useRolesStore((store) => store.setRoles);
  const roles = useRolesStore((store) => store.roles);

  useEffect(() => {
    setUserRole(user?.role?.name || null);
    if (!roles.length) {
      fetchRoles();
    }
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
  const RoleContainer = ({ role }: { role: Role }) => {
    const [loading, setLoading] = useState(false);
    const changeRole = async (roleId: number) => {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/roles/assign-role-to-user", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roleId: roleId,
            userId: user.id,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          setUserRole(data.user.role.name);
        }
      } catch (error) {
        console.error(error, "Error");
      } finally {
        setLoading(false);
      }
    };

    const RenderIcon = () => {
      if (role.name === userRole) {
        return (
          <div className="rounded-lg p-1 bg-muted flex flex-col justify-center items-center hover:bg-muted/70 transition-all cursor-pointer">
            {loading ? (
              <LoadingCatch className="h-8 w-8" />
            ) : (
              <Check className="h-8 w-8 text-green-500" />
            )}
          </div>
        );
      } else if (userRole === null) {
        return (
          <div
            onClick={() => changeRole(role.id)}
            className="rounded-lg p-1 bg-muted flex flex-col justify-center items-center hover:bg-muted/70 transition-all cursor-pointer"
          >
            {" "}
            {loading ? (
              <LoadingCatch className="h-8 w-8" />
            ) : (
              <Plus className="h-8 w-8 text-accent" />
            )}
          </div>
        );
      }
      return (
        <div
          onClick={() => changeRole(role.id)}
          className="rounded-lg p-1 bg-muted flex flex-col justify-center items-center hover:bg-muted/70 transition-all cursor-pointer"
        >
          {loading ? (
            <LoadingCatch className="h-8 w-8" />
          ) : (
            <Replace className="h-8 w-8 text-primary" />
          )}
        </div>
      );
    };
    return (
      <div className="w-full flex bg-muted/20 p-2 border rounded-lg justify-between">
        <div className="flex flex-col">
          <p className="font-bold">{role.name}</p>
          <p className="text-sm italic font-muted-foreground">
            {role.description}
          </p>
        </div>
        {RenderIcon()}
      </div>
    );
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="font-semibold">
          {userRole || "No Role Assigned"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Update {user.name}'s role</DialogTitle>
          <DialogDescription>
            A user can only have one role at a time so be cautious when
            switching a user's permission.
          </DialogDescription>
        </DialogHeader>
        <div className="h-[350px] p-2 bg-muted/50 space-y-2 rounded-lg overflow-y-auto">
          {roles.map((role) => (
            <RoleContainer key={role.id} role={role} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserRole;
