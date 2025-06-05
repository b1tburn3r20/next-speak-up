import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

  return <div>Logged in</div>;
}
