"use client";
import { GaugeCircle, Home, Scale, Users, Building2, Flag } from "lucide-react";
import { useSession } from "next-auth/react";
import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { status, data: session } = useSession();

  // Get the user's state from the session, if available
  const userState = session?.user?.state?.toLowerCase() || "";

  // Create the Congress Members URL based on state
  const congressMembersUrl = userState
    ? `/congress/congress-members?query=${userState}&page=1`
    : "/congress/congress-members?page=1";

  // Generate the items for Federal section
  const getFederalItems = () => {
    const baseItems = [
      {
        title: "Representing You",
        url: congressMembersUrl,
      },
      {
        title: "All House + Senate",
        url: "/congress/congress-members",
      },
      {
        title: "Bills",
        url: "/federal/bills",
      },
    ];

    // Add favorites link if user is authenticated
    if (status === "authenticated" && session?.user?.id) {
      baseItems.unshift({
        title: "My Favorites",
        url: `/congress/congress-members/favorites`,
      });
    }

    return baseItems;
  };

  const data = {
    navMain: [
      {
        title: "State",
        url: "#",
        icon: Building2,
        items: [
          { title: "Voting Soon", url: "/state/bills/upcoming" },
          { title: "Recently Passed", url: "/state/bills/upcoming/" },
          { title: "Representatives", url: "/state/representatives" },
        ],
      },
      {
        title: "Federal",
        url: "#",
        icon: Flag,
        items: getFederalItems(),
      },
      {
        title: "Dev",
        url: "#",
        icon: Users,
        items: [
          {
            title: "Add Contacts to Congress Members",
            url: "/dev/add-contacts",
          },
        ],
      },
    ],
    projects: [
      {
        name: "Dashboard",
        url: "/dashboard",
        icon: GaugeCircle,
      },
      {
        name: "Home",
        url: "/",
        icon: Home,
      },
    ],
  };

  // Only create user data if we have a valid session
  const userData = session?.user
    ? {
        name: session.user.name || "",
        email: session.user.email || "",
        avatar: session.user.image || "",
      }
    : null;

  const renderFooter = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex items-center justify-center p-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        );
      case "authenticated":
        return userData ? <NavUser user={userData} /> : null;
      case "unauthenticated":
        return (
          <Link
            href="/api/auth/signin"
            className="flex items-center justify-center p-4 text-sm hover:underline"
          >
            Login / Signup
          </Link>
        );
      default:
        return null;
    }
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>{renderFooter()}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
