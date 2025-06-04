"use client";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  Settings,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { ModeToggle } from "./ui/mode-toggle";
import LoadingCatch from "@/app/GeneralComponents/Onboarding/components/LoadingCatch";
import ShinyButton from "./ui/shiny-button";

export function NavUser() {
  const { data: session, status } = useSession();

  const startQuickstart = async () => {
    try {
      const response = await fetch("/api/user/onboarding", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to start quickstart");
      }

      window.location.reload();
    } catch (error) {
      console.error("Error starting quickstart:", error);
    }
  };

  const renderAvatarContent = () => {
    return (
      <>
        <AvatarImage
          src={user.image || ""}
          alt={user.name || "User"}
          referrerPolicy="no-referrer"
        />
        <AvatarFallback className="rounded-lg bg-primary/10">
          {user.name?.slice(0, 2).toUpperCase() || "U"}
        </AvatarFallback>
      </>
    );
  };
  // Handle loading state
  if (status === "loading") {
    return <LoadingCatch />;
  }

  // Handle no session
  if (!session?.user || status === "unauthenticated") {
    return (
      <div className="w-full flex justify-center items-center ">
        <Link href={"/api/auth/signin"}>
          <ShinyButton>Log / Sign in</ShinyButton>
        </Link>
      </div>
    );
  }
  const user = session.user;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-12 hover:bg-muted w-full justify-start px-3 py-2"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            {renderAvatarContent()}
          </Avatar>
          <div className="ml-3 grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuGroup className="flex gap-2 justify-between">
          <Link href="/settings" className="w-full">
            <DropdownMenuItem className="w-full ">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
          </Link>
          <ModeToggle />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={startQuickstart}>
            <Sparkles className="mr-2 h-4 w-4" />
            Quickstart
          </DropdownMenuItem>

          <DropdownMenuItem>
            <BadgeCheck className="mr-2 h-4 w-4" />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/api/auth/signout">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NavUser;
