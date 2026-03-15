import UserBookmarkedForumPosts from "@/app/dashboard-components/UserForumBookmarks/UserBookmarkedForumPosts"
import UserTrackedBills from "@/app/dashboard-components/UserTrackedBills/UserTrackedBills"
import ActivityPointsWidget from "@/app/dashboard-components/widgets/ActivityPointsWidget"
import { AuthSession } from "@/lib/types/user-types"
import UserPersonalizedDashboardRepresentativeWidget from "./user-personalized-dashboard-representative-widget"

interface UserPersonalizedDashboardProps {
  session: AuthSession
}

const UserPersonalizedDashboard = ({ session }: UserPersonalizedDashboardProps) => {
  return (
    <div className="">
      <UserPersonalizedDashboardRepresentativeWidget />
      {/* <div className="max-w-full overflow-hidden"> */}
      {/*   <UserTrackedBills /> */}
      {/* </div> */}
      {/* <div className="max-w-full overflow-hidden"> */}
      {/*   <UserBookmarkedForumPosts userId={session?.user?.id} /> */}
      {/* </div> */}
    </div>


  )
}

export default UserPersonalizedDashboard
