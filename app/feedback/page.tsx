import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { FeedbackForm } from "@/components/app/feedback-form";
import { PageContainer, Panel } from "@/components/app/page-states";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Report a problem or suggest an improvement to Coolbills.",
};

export default async function FeedbackPage() {
  const session = await getServerSession(authOptions);
  return (
    <PageContainer>
      <div>
        <h1 className="text-2xl font-semibold">Feedback</h1>
        <p className="text-sm text-muted-foreground">
          Found something wrong, especially wrong data? Tell us and we&apos;ll look into it.
        </p>
      </div>
      <Panel aria-label="Feedback form">
        <FeedbackForm signedIn={Boolean(session?.user?.id)} />
      </Panel>
    </PageContainer>
  );
}
