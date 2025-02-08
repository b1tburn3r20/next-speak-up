// app/settings/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { userService } from "@/lib/services/user";
import { SettingsForm } from "./components/SettingsForm";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const user = await userService.getUserById(session.user.id);

  if (!user) {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        <div className=" rounded-lg shadow p-6">
          <SettingsForm
            id={user.id}
            name={user.name}
            username={user.username}
            email={user.email}
            state={user.state}
            ageRange={user.ageRange}
            householdIncome={user.householdIncome}
          />
        </div>
      </div>
    </div>
  );
}
