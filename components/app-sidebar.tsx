"use client";
import { GaugeCircle, Home, Scale, Signature, Users } from "lucide-react";
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

  const data = {
    navMain: [
      {
        title: "Affecting You",
        url: "#",
        icon: Scale,
        items: [
          { title: "Just passed", url: "#" },
          { title: "Upcoming", url: "#" },
        ],
      },
      {
        title: "People in Power",
        url: "/congress",
        icon: Users,
        isActive: true,
        items: [
          { title: "For you", url: "#" },
          { title: "All House + Senate", url: "/congress/congress-members" },
        ],
      },
      {
        title: "Contact PIP",
        url: "#",
        icon: Signature,
        items: [
          { title: "Introduction", url: "#" },
          { title: "Get Started", url: "#" },
          { title: "Tutorials", url: "#" },
          { title: "Changelog", url: "#" },
        ],
      },
    ],
    base: [
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
        <NavProjects projects={data.base} />
      </SidebarContent>
      <SidebarFooter>{renderFooter()}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
