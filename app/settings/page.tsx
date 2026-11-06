import { OuterBlock, PageHeader, PageShell } from "@/components/blocks";
import type { Metadata } from 'next';
// app/settings/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { userService } from "@/lib/services/user";
import { SettingsForm } from "./components/settings-form";
import { NextStepCard } from "@/components/civic/next-step-card";
import { routes } from "@/lib/routes";


export const metadata: Metadata = {
  "title": "Coolbills | Settings page",
  description: "Update your settings here."
};


export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const user = await userService.getUserById(session.user.id);

  if (!user) {
    redirect("/");
  }

  return (
    <PageShell width="narrow">
      <PageHeader title="Account settings" />
      <OuterBlock>
        <SettingsForm
          id={user.id}
          name={user.name}
          username={user.username}
          state={user.state}
          district={user.district ? String(user.district) : undefined}
          ageRange={user.ageRange}
          householdIncome={user.householdIncome}
        />
      </OuterBlock>
      <NextStepCard
        label="Choose what you follow"
        step={{
          id: "settings-topics",
          title: "Topics you track",
          description: "Bills on these topics come first when you vote.",
          href: routes.federal.topics,
          cta: "Change my topics",
          tone: "primary",
        }}
      />
    </PageShell>
  );
}
