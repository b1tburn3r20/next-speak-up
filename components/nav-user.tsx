"use client";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import { signOut } from "next-auth/react";
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
import { useLoginStore } from "@/app/app/navbar/useLoginStore";
import { ModeToggle } from "./ui/mode-toggle";
import LoadingCatch from "@/app/GeneralComponents/Onboarding/components/LoadingCatch";
import ShinyButton from "./ui/shiny-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import LoginForm from "./login-form";
import { useNavbarStore } from "@/app/app/navbar/useNavbarStore";

export function NavUser() {
  const { data: session, status } = useSession();
  const { navCollapsed } = useNavbarStore();
  const { isLoginDialogOpen, setIsLoginDialogOpen } = useLoginStore();
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

  // Handle loading state
  if (status === "loading") {
    return <LoadingCatch />;
  }

  // Handle no session
  if (!session?.user || status === "unauthenticated") {
    return (
      <div className="w-full flex justify-center items-center">
        <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
          <DialogTrigger asChild>
            <div className={navCollapsed ? "w-fit m-2" : "w-full m-2"}>
              <ShinyButton className={navCollapsed ? "w-fit px-2" : "w-full"}>
                {navCollapsed ? <User /> : "Login / Sign up"}
              </ShinyButton>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Choose a signin option</DialogTitle>
            </DialogHeader>
            <LoginForm />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const user = session.user;

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

  return (
    <div className={`${navCollapsed ? "p-[8px]" : "p-2"}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`relative h-12 hover:bg-muted shrink-0 transition-all ${
              navCollapsed
                ? "w-12 justify-center p-0"
                : "w-full justify-start px-3 py-2"
            }`}
          >
            <Avatar className="h-8 w-8  rounded-lg shrink-0">
              {renderAvatarContent()}
            </Avatar>
            {!navCollapsed && (
              <>
                <div className="ml-3 grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate text-foreground font-semibold">
                    {user.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                  {user.username && (
                    <span className="truncate text-xs italic text-primary">
                      @{user.username || ""}
                    </span>
                  )}
                </div>
                <ChevronsUpDown className="ml-auto text-muted-foreground h-4 w-4" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 rounded-lg"
          align="end"
          sideOffset={4}
        >
          <DropdownMenuGroup className="flex gap-2 justify-between">
            <Link href="/settings" className="w-full">
              <DropdownMenuItem className="w-full">
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
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: window.location.href })}
            className="cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default NavUser;
