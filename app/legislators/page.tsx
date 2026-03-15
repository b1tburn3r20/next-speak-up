import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { AuthSession } from "@/lib/types/user-types";
import { getCongressLegislators } from "@/lib/services/legislators/legislators-page";
import { Metadata } from "next";
import AllActiveLegislators from "./components/AllActiveLegislators";
import StateAndDistrictSelectDialog from "../1Components/components/General/StateAndDistrictSelectDialog";
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

  //

  const results = await getCongressLegislators(userId, role);
  return (
    <div className="flex flex-col pt-4 space-y-12">
      <SearchLegislators legislators={results} />
      <AllActiveLegislators legislators={results} userId={userId} />
      <StateAndDistrictSelectDialog />
    </div>
  );
};

export default Page;
