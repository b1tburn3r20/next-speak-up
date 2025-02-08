import { Metadata } from "next";
import { congressService } from "@/lib/services/congress";
import { PageHeader } from "@/app/PageComponents/PageHeader";
import { PageBreadcrumb } from "@/app/PageComponents/PageBreadcrumb";
import { CongressMemberCard } from "../../components/CongressMemberCard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Favorite Congress Members | Speakup",
  description: "View your favorite Congress members",
  openGraph: {
    title: "Favorite Congress Members",
    description: "Your saved Congress members",
    type: "website",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default async function FavoriteCongressPage() {
  // Get the user session
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // Get user's favorites
  const { members, pagination } = await congressService.getUserFavorites(
    session.user.id,
    1, // page
    50 // limit
  );

  const breadcrumbItems = [
    { label: "Government", href: "/government" },
    { label: "Congress Members", href: "/congress/congress-members" },
    { label: "Favorites" },
  ];

  return (
    <div className="container mx-auto py-6">
      <PageBreadcrumb items={breadcrumbItems} />
      <PageHeader
        title="Favorite Congress Members"
        description={
          members.length === 0
            ? "You haven't favorited any Congress members yet"
            : `Showing ${members.length} of ${pagination.total} favorites`
        }
        className="mb-6"
      />

      {members.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            To add favorites, browse Congress members and click the star icon
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <CongressMemberCard key={member.bioguideId} member={member} />
          ))}
        </div>
      )}

      {members.length > 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Page {pagination.currentPage} of {pagination.pages}
        </div>
      )}
    </div>
  );
}
