"use client";

import { Button } from "@/components/ui/button";
import { Loader2, X, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useDialogStore } from "@/app/stores/useDialogStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useCallback, useRef } from "react";
import _ from "lodash";

interface UsernameSelectDialogProps {
  onUsernameCreation: (username: string) => void;
}

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "error";

const UsernameSelectDialog = ({
  onUsernameCreation,
}: UsernameSelectDialogProps) => {
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const abortControllerRef = useRef<AbortController | null>(null);

  const isUsernameDialogOpen = useDialogStore(
    (state) => state.isUsernameSelectDialogOpen
  );
  const setIsUsernameSelectDialogOpen = useDialogStore(
    (state) => state.setIsUsernameSelectDialogOpen
  );

  const checkIfUsernameIsAvailable = async (usernameToCheck: string) => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      setUsernameStatus("checking");

      const response = await fetch("/api/user/check-username-availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: usernameToCheck }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to check username");
      }

      const data = await response.json();

      // data.isAvailable should be true if username is available, false if taken
      setUsernameStatus(data.isAvailable ? "available" : "taken");
    } catch (error) {
      if (error.name === "AbortError") {
        // Request was cancelled, don't update state
        return;
      }
      console.error("Error checking username:", error);
      setUsernameStatus("error");
    }
  };

  // Create debounced version of the check function
  const debouncedUsernameCheck = useCallback(
    _.debounce((usernameToCheck: string) => {
      if (usernameToCheck.trim().length > 0) {
        checkIfUsernameIsAvailable(usernameToCheck);
      } else {
        setUsernameStatus("idle");
      }
    }, 500),
    []
  );

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);

    // Reset status when user starts typing
    if (usernameStatus !== "checking") {
      setUsernameStatus("idle");
    }

    // Trigger debounced check
    debouncedUsernameCheck(newUsername);
  };

  const handleSetUsername = async () => {
    if (usernameStatus === "available" && username.trim()) {
      onUsernameCreation(username);
      setIsUsernameSelectDialogOpen(false);
      // Reset form state
      setUsername("");
      setUsernameStatus("idle");
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsUsernameSelectDialogOpen(open);
    if (!open) {
      // Reset form state when dialog closes
      setUsername("");
      setUsernameStatus("idle");
    }
  };

  const getStatusIcon = () => {
    switch (usernameStatus) {
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "available":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "taken":
        return <X className="h-4 w-4 text-red-500" />;
      case "error":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (usernameStatus) {
      case "checking":
        return (
          <span className="text-sm text-blue-500">
            Checking availability...
          </span>
        );
      case "available":
        return (
          <span className="text-sm text-green-500">Username is available!</span>
        );
      case "taken":
        return (
          <span className="text-sm text-red-500">
            Username is already taken
          </span>
        );
      case "error":
        return (
          <span className="text-sm text-red-500">Error checking username</span>
        );
      default:
        return null;
    }
  };

  const isSubmitDisabled = usernameStatus !== "available" || !username.trim();

  return (
    <Dialog open={isUsernameDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="min-h-[300px]">
        <DialogHeader>
          <DialogTitle>New around here?</DialogTitle>
          <DialogDescription className="p-2 text-muted-foreground bg-accent italic rounded-lg">
            Before you can do that you'll need a username. Think of something
            unique and give it a whirl!
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col justify-between h-full">
          <div className="gap-2 flex flex-col">
            <Label>Username</Label>
            <div className="relative">
              <Input
                placeholder="Enter your new username"
                onChange={handleUsernameChange}
                value={username}
                className="pr-8"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                {getStatusIcon()}
              </div>
            </div>
            {getStatusMessage()}
          </div>
          <Button
            className="mt-4 w-fit"
            onClick={handleSetUsername}
            disabled={isSubmitDisabled}
          >
            Ready to go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UsernameSelectDialog;
