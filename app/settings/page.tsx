import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight, Compass, UserRound } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OuterBlock, PageHeader, PageSpacer } from "@/components/blocks";
import { ThemeChoice } from "@/components/theme-toggle";
import { profilePath, routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Settings",
  description: "Choose how Coolbills looks and works for you.",
};

function SettingLink({ href, icon: Icon, title, description, testId }: { href: string; icon: typeof Compass; title: string; description: string; testId: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl border-2 border-b-4 bg-card p-4 hover:bg-muted" data-testid={testId}>
      <Icon className="size-6 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold">{title}</span>
        <span className="block text-sm text-muted-foreground">{description}</span>
      </span>
      <ArrowRight className="size-4 shrink-0" aria-hidden />
    </Link>
  );
}

/** Your details are edited on your profile, where they show. This is for how the app works. */
export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");
  return (
    <PageSpacer width="narrow">
      <PageHeader title="Settings" />
      <OuterBlock className="space-y-3" data-testid="settings-theme">
        <h2 className="text-lg font-extrabold">Appearance</h2>
        <ThemeChoice />
      </OuterBlock>
      <SettingLink
        href={`${profilePath(session.user.id)}?edit=1`}
        icon={UserRound}
        title="Your details"
        description="Name, username, state, and what you share. Edit them right on your profile."
        testId="settings-profile"
      />
      <SettingLink
        href={routes.federal.topics}
        icon={Compass}
        title="Topics you track"
        description="Bills on these topics come first when you vote."
        testId="settings-topics"
      />
    </PageSpacer>
  );
}
