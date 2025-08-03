import { getComprehensiveLegislatorInformation } from "@/lib/services/legislators/legislator-id";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AuthSession } from "@/lib/types/user-types";
import CongressMemberCard from "./components/CongressMemberCard";

interface PageProps {
  params: Promise<{
    bioguideId: string;
  }>;
}

const Page = async ({ params }: PageProps) => {
  const session: AuthSession = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role?.name;
  const bioguideId = (await params).bioguideId;

  const data = await getComprehensiveLegislatorInformation(
    bioguideId,
    userId,
    userRole
  );

  return (
    <div className="p-4">
      <CongressMemberCard congressMember={data} />
    </div>
  );
};

export default Page;
