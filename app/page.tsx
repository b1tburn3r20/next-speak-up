import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import TestApiButton from "@/components/dev/TestApiButton";
import { getServerSession } from "next-auth";

// Dashboard Home Component (Server Component)
export default async function Home() {
  // Get the authenticated user session
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return (
      <div className="p-4">
        <p>Please sign in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div>
      <img
        src="https://www.cise.ufl.edu/~kcen/cis4930/assign5/assign5_files/spinning.gif"
        alt="minecwaf"
      />
      <TestApiButton />
    </div>
  );
}
