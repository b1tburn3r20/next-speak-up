import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AuthSession } from "@/lib/types/user-types";
import { getCongressLegislators } from "@/lib/services/legislators/legislators-page";
import { Metadata } from "next";
import AllActiveLegislators from "./components/AllActiveLegislators";
import UsersStateLegislators from "./components/UsersStateLegislators";
import UsersLegislators from "./components/UsersLegislators";
import StateAndDistrictSelectDialog from "@/app/1Components/components/General/StateAndDistrictSelectDialog";
import SearchLegislators from "./components/SearchLegislators";

export const metadata: Metadata = {
  title: {
    default: "Congress Members And Legislators",
    template: "%s | Coolbills",
  },
  description:
    "Browse and search through comprehensive data about the U.S. Congress",
  keywords: [
    "Congress",
    "Politics",
    "Government",
    "Representatives",
    "Senators",
  ],
};

const Page = async () => {
  const session: AuthSession = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const role = session?.user?.role?.name;
  const usersState = session?.user?.state;
  const usersDistrict = session?.user?.district;

  //

  const results = await getCongressLegislators(userId, role);
  const usersStateLegislators = results.filter((f) => f.state === usersState);
  return (
    <div className="flex flex-col pt-4 space-y-12 container mx-auto">
      <SearchLegislators legislators={results} />
      <div className="space-y-[100px]">
        <div className="bg-accent/40 p-4 rounded-lg flex items-center justify-center flex-col">
          <UsersLegislators
            legislators={usersStateLegislators}
            userId={userId}
            usersState={usersState}
            usersDistrict={usersDistrict}
          />
        </div>

        <UsersStateLegislators
          legislators={usersStateLegislators}
          usersState={usersState}
          userId={userId}
        />
        <AllActiveLegislators legislators={results} userId={userId} />
      </div>

      <StateAndDistrictSelectDialog />
    </div>
  );
};

export default Page;
