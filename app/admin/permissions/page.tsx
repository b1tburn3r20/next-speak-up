import { getAllUsers } from "@/lib/services/user";
import SelectUsers from "./components/SelectUsers";

const Page = async () => {
  const users = await getAllUsers();

  return (
    <div className="min-h-screen">
      <SelectUsers users={users} />
    </div>
  );
};

export default Page;
