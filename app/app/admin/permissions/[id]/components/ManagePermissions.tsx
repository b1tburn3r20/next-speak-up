import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { ShieldPlus } from "lucide-react";
import CreatePermission from "./CreatePermission";
import CreateRole from "./CreateRole";
import ManageRoles from "./ManageRoles";

const ManagePermissions = () => {
  return (
    <Dialog>
      <DialogTrigger className="absolute bottom-5 right-5" asChild>
        <Button size="icon">
          <ShieldPlus />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Permissions and Roles</DialogTitle>
          <DialogDescription>
            Manage permissions and roles, creation, editing and assignment
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="create-permissions" className="h-[400px]">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="create-permissions">
              Create Permissions
            </TabsTrigger>
            <TabsTrigger value="create-role">Create Roles</TabsTrigger>
            <TabsTrigger value="manage-roles">Manage Roles</TabsTrigger>
          </TabsList>
          <TabsContent className="h-[80%]" value="create-permissions">
            <CreatePermission />
          </TabsContent>
          <TabsContent className="h-[80%]" value="create-role">
            <CreateRole />
          </TabsContent>
          <TabsContent className="h-[80%]" value="manage-roles">
            <ManageRoles />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ManagePermissions;
