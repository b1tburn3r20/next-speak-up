import { FullRole } from "@/app/admin/stores/useRolesStore";
import LoadingCatch from "@/app/GeneralComponents/Onboarding/components/LoadingCatch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Permission, Role } from "@prisma/client";
import { ArrowLeft, ArrowRight, Edit, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ManageRoleProps {
  roles: Role[];
  allPermissions: Permission[];
}

const ManageRoleList = ({ roles, allPermissions }: ManageRoleProps) => {
  const [fetchingData, setFetchingData] = useState<boolean>(false);
  const [roleData, setRoleData] = useState<FullRole | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const EditRoleDialog = () => {
    if (!roleData) {
      return null;
    }

    const allPermissionsNotInRole = allPermissions.filter(
      (permission) =>
        !roleData.permissions.some(
          (rolePermission) => rolePermission.permissionId === permission.id
        )
    );

    const allPermissionsInRole = allPermissions.filter((permission) =>
      roleData.permissions.some(
        (rolePermission) => rolePermission.permissionId === permission.id
      )
    );

    const AddPermission = ({ permission }: { permission: Permission }) => {
      const [adding, setAdding] = useState<boolean>(false);
      const addPermission = async () => {
        setAdding(true);
        try {
          const response = await fetch(
            "/api/admin/roles/assign-permission-to-role",
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                permissionId: permission.id,
                roleId: roleData.id,
              }),
            }
          );

          const data = await response.json();

          if (response.ok) {
            setRoleData(data.role);
          } else {
            console.error("Failed to add permission:", data);
            toast.error("Seems like something went wrong...");
          }
        } catch (error) {
          console.error("Network error:", error);
        } finally {
          setAdding(false);
        }
      };

      return (
        <div className="flex justify-between bg-muted/50 p-2 rounded-lg items-center">
          <div className="flex flex-col text-start">
            <p className="font-bold">{permission.name}</p>
            <p className="italic text-sm text-muted-foreground">
              {permission?.description}
            </p>
          </div>
          <Button
            onClick={addPermission}
            disabled={adding}
            variant="ghost"
            className="h-12 shrink-0 ml-1 w-12 p-0"
          >
            {adding ? (
              <Loader2 className="animate-spin" />
            ) : (
              <ArrowRight className="h-6 w-6" />
            )}
          </Button>
        </div>
      );
    };
    const RemovePermission = ({ permission }: { permission: Permission }) => {
      const [removing, setRemoving] = useState<boolean>(false);
      const removePermission = async () => {
        setRemoving(true);
        try {
          const response = await fetch(
            "/api/admin/roles/remove-permission-from-role",
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                permissionId: permission.id,
                roleId: roleData.id,
              }),
            }
          );

          const data = await response.json();

          if (response.ok) {
            setRoleData(data.role);
          } else {
            console.error("Failed to add permission:", data);
            toast.error("Seems like something went wrong...");
          }
        } catch (error) {
          console.error("Network error:", error);
        } finally {
          setRemoving(false);
        }
      };

      return (
        <div className="flex justify-between bg-muted/50 p-2 rounded-lg items-center">
          <div className="flex flex-col text-start">
            <p className="font-bold">{permission.name}</p>
            <p className="italic text-sm text-muted-foreground">
              {permission?.description}
            </p>
          </div>
          <Button
            onClick={removePermission}
            disabled={removing}
            variant="destructive"
            className="h-12 shrink-0 ml-1 w-12 p-0"
          >
            {removing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <ArrowLeft className="h-6 w-6" />
            )}{" "}
          </Button>
        </div>
      );
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          {fetchingData ? (
            <LoadingCatch
              message="Fetching role data..."
              secondaryMessage="please wait..."
            />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Manage Role: {roleData.name}</DialogTitle>
              </DialogHeader>
              <div className="flex justify-between">
                <div className="space-y-2  border p-2 rounded-lg w-1/2">
                  <div>
                    <Label className="text-lg font-thin mb-2">
                      Available Permissions
                    </Label>
                    <Separator className="my-2" />
                    <div className="space-y-2 ">
                      {allPermissionsNotInRole.map((permission) => (
                        <AddPermission
                          key={permission.id}
                          permission={permission}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <Separator
                  className="h-full mx-6 w-[1px]"
                  orientation="vertical"
                />
                <div className="space-y-2  border p-2 rounded-lg w-1/2">
                  <div>
                    <Label className="text-lg font-thin mb-2">
                      Current Permissions
                    </Label>
                    <Separator className="my-2" />
                    <div className="space-y-2 ">
                      {allPermissionsInRole.map((permission) => (
                        <RemovePermission
                          key={permission.id}
                          permission={permission}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  const RoleContainer = ({ role }: { role: Role }) => {
    const handleRoleClick = (id: number) => {
      setOpen(true);
      fetchRoleData(id);
    };

    const fetchRoleData = async (id: number) => {
      setFetchingData(true);
      try {
        const response = await fetch(
          `/api/admin/roles/get-role-data?roleId=${id}`
        );
        const data = await response.json();
        if (response.ok) {
          setRoleData(data.role);
        }
        setFetchingData(false);
      } catch (error) {
        setFetchingData(false);
        console.error("Something went wrong", error);
      }
    };

    return (
      <div className="w-full flex bg-muted/50 p-2 border rounded-lg justify-between">
        <div className="flex flex-col">
          <p className="font-bold">{role.name}</p>
          <p className="text-sm italic font-muted-foreground">
            {role.description}
          </p>
        </div>
        <div
          onClick={() => handleRoleClick(role.id)}
          className="rounded-lg p-1 bg-muted flex flex-col justify-center items-center hover:bg-muted/70 transition-all cursor-pointer"
        >
          <Edit className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
    );
  };

  if (!roles) {
    return null;
  }

  return (
    <>
      <ScrollArea className="h-[400px] overflow-y-auto">
        {roles.map((role) => (
          <RoleContainer key={role.id} role={role} />
        ))}
      </ScrollArea>
      <EditRoleDialog />
    </>
  );
};

export default ManageRoleList;
