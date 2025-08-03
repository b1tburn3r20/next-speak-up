// components/UsernameSelectDialog.tsx (Improved version)
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
import { useDialogStore } from "@/app/app/stores/useDialogStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useCallback, useRef, useEffect } from "react";
import _ from "lodash";

interface UsernameSelectDialogProps {
  onUsernameCreation: (username: string) => void;
}

type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "error"
  | "invalid";

const UsernameSelectDialog = ({
  onUsernameCreation,
}: UsernameSelectDialogProps) => {
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debouncedCheckRef = useRef<_.DebouncedFunc<
    (username: string) => void
  > | null>(null);

  const isUsernameDialogOpen = useDialogStore(
    (state) => state.isUsernameSelectDialogOpen
  );
  const setIsUsernameSelectDialogOpen = useDialogStore(
    (state) => state.setIsUsernameSelectDialogOpen
  );

  // Client-side validation
  const validateUsername = (
    usernameToValidate: string
  ): { isValid: boolean; message?: string } => {
    if (usernameToValidate.length < 3) {
      return {
        isValid: false,
        message: "Username must be at least 3 characters long",
      };
    }
    if (usernameToValidate.length > 30) {
      return {
        isValid: false,
        message: "Username must be less than 30 characters",
      };
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(usernameToValidate)) {
      return {
        isValid: false,
        message: "Username can only contain letters, numbers, and underscores",
      };
    }
    return { isValid: true };
  };

  const checkIfUsernameIsAvailable = async (usernameToCheck: string) => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      setUsernameStatus("checking");
      setErrorMessage("");

      const response = await fetch("/api/user/check-username-availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: usernameToCheck }),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check username");
      }

      setUsernameStatus(data.isAvailable ? "available" : "taken");
    } catch (error: any) {
      if (error.name === "AbortError") {
        return;
      }
      console.error("Error checking username:", error);
      setUsernameStatus("error");
      setErrorMessage(error.message || "Error checking username");
    }
  };

  // Create debounced version of the check function
  useEffect(() => {
    debouncedCheckRef.current = _.debounce((usernameToCheck: string) => {
      if (usernameToCheck.trim().length > 0) {
        const validation = validateUsername(usernameToCheck);
        if (!validation.isValid) {
          setUsernameStatus("invalid");
          setErrorMessage(validation.message || "Invalid username");
          return;
        }
        checkIfUsernameIsAvailable(usernameToCheck);
      } else {
        setUsernameStatus("idle");
        setErrorMessage("");
      }
    }, 500);

    return () => {
      // Cleanup on unmount
      if (debouncedCheckRef.current) {
        debouncedCheckRef.current.cancel();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);

    // Reset status when user starts typing
    if (usernameStatus !== "checking") {
      setUsernameStatus("idle");
      setErrorMessage("");
    }

    // Trigger debounced check
    if (debouncedCheckRef.current) {
      debouncedCheckRef.current(newUsername);
    }
  };

  const handleSetUsername = async () => {
    if (usernameStatus === "available" && username.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        const response = await fetch("/api/user/set-username", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: username.trim() }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to set username");
        }

        onUsernameCreation(username.trim());
        setIsUsernameSelectDialogOpen(false);
        resetForm();
      } catch (error: any) {
        console.error("Error setting username:", error);
        setErrorMessage(error.message || "Failed to set username");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const resetForm = () => {
    setUsername("");
    setUsernameStatus("idle");
    setErrorMessage("");
    setIsSubmitting(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsUsernameSelectDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const getStatusIcon = () => {
    if (isSubmitting) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }

    switch (usernameStatus) {
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "available":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "taken":
      case "error":
      case "invalid":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    if (errorMessage) {
      return <span className="text-sm text-red-500">{errorMessage}</span>;
    }

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

  const isSubmitDisabled =
    usernameStatus !== "available" || !username.trim() || isSubmitting;

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
                placeholder="Enter your new username (3-30 characters, letters, numbers, _)"
                onChange={handleUsernameChange}
                value={username}
                className="pr-8"
                disabled={isSubmitting}
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
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Setting username...
              </>
            ) : (
              "Ready to go!"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UsernameSelectDialog;
