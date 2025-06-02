import { User } from "@prisma/client";

const UserAccountPermissionsTab = ({ user }: { user: User }) => {
  return <div>Here I will show {user.username || user.name}'s permissions</div>;
};

export default UserAccountPermissionsTab;
