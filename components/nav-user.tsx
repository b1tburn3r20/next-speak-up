import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Settings,
  Settings2,
  Sparkles,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ModeToggle } from "./ui/mode-toggle";
import Link from "next/link";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    console.log("NavUser mounted with user:", {
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    });
    // Reset image error state when user changes
    setImageError(false);
  }, [user]);

  const handleAvatarError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    console.error("Avatar failed to load:", {
      src: user.avatar,
      error: e.currentTarget.error,
      crossOrigin: e.currentTarget.crossOrigin,
      naturalHeight: e.currentTarget.naturalHeight,
      naturalWidth: e.currentTarget.naturalWidth,
    });
    setImageError(true);
  };

  const handleAvatarLoad = () => {
    console.log("Avatar loaded successfully");
    setImageError(false);
  };

  // Function to render avatar content
  const renderAvatarContent = () => {
    if (!user.avatar || imageError) {
      return (
        <AvatarFallback className="rounded-lg bg-primary/10">
          {user.name?.slice(0, 2).toUpperCase() || "U"}
        </AvatarFallback>
      );
    }

    return (
      <>
        <AvatarImage
          src={user.avatar}
          alt={user.name}
          onError={handleAvatarError}
          onLoad={handleAvatarLoad}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
        <AvatarFallback className="rounded-lg bg-primary/10">
          {user.name?.slice(0, 2).toUpperCase() || "U"}
        </AvatarFallback>
      </>
    );
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {renderAvatarContent()}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {renderAvatarContent()}
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ModeToggle />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Settings className="mr-2" />
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck className="mr-2" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="mr-2" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2" />
              <Link href="/api/auth/signout">Logout</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default NavUser;
