import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import UserAccountPermissionsTab from "./UserAccountPermissionsTab";
import { User } from "@prisma/client";
interface UserAccountTabsProps {
  user: User;
}
const UserAccountTabs = ({ user }: UserAccountTabsProps) => {
  return (
    <Tabs defaultValue="permissions" className="w-full">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="permissions">Permissions</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="permissions">
        <UserAccountPermissionsTab user={user} />
      </TabsContent>
      <TabsContent value="activity">Change your password here.</TabsContent>
    </Tabs>
  );
};

export default UserAccountTabs;
