
import { getAllUsers } from "@/lib/services/user"
import SelectUsers from "./components/SelectUsers";

const Page = async () => {
  const users = await getAllUsers(); // <- Add await
   

  return (
    <div>
      <SelectUsers users={users} />    
    </div>
  )
}

export default Page
