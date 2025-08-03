"use client";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { CircleCheck, CircleX, Loader2, ShieldPlus, Smile } from "lucide-react";
import { useState, useCallback } from "react";
import { debounce } from "lodash";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Permission } from "@prisma/client";

const CreatePermission = () => {
  const [inputValue, setInputValue] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState("");

  const checkIfPermissionIsAvailable = async (value: string) => {
    if (!value.trim()) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch(
        `/api/admin/permissions/check-permission?permissionName=${encodeURIComponent(
          value
        )}`
      );
      const data = await response.json();

      if (response.ok) {
        // If permission exists, it's NOT available for creation
        setIsAvailable(!data.exists);
      } else {
        console.error("API error:", data.error);
        setIsAvailable(null);
      }
    } catch (error) {
      console.error("Network error:", error);
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  const createPermission = async () => {
    if (!inputValue.trim() || !isAvailable) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/permissions/create-permission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          permissionName: inputValue.trim(),
          description: description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setInputValue("");
        setDescription("");
        setIsAvailable(null);
        toast.success(`Permission: ${data.permission.name} created.`);
      } else {
        console.error("Failed to create permission:", data);
        toast.error("Seems like something went wrong...");
      }
    } catch (error) {
      console.error("Network error:", error);
      // You might want to show an error toast here
    } finally {
      setSubmitting(false);
    }
  };

  // Debounce the API call to avoid too many requests
  const debouncedCheck = useCallback(
    debounce(checkIfPermissionIsAvailable, 500),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (!value.trim()) {
      setIsChecking(false);
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    debouncedCheck(value);
  };

  const getIcon = () => {
    if (isChecking) return <Loader2 className="animate-spin" />;
    if (isAvailable === null)
      return <Smile className="text-muted-foreground" />;
    if (isAvailable === true) return <CircleCheck className="text-green-500" />;
    if (isAvailable === false) return <CircleX className="text-red-500" />;
    return null;
  };

  const isCreateDisabled = !isAvailable || submitting || !inputValue.trim();

  return (
    <div className="space-y-2 h-full flex flex-col justify-between bg-muted/50 rounded-lg p-2">
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <Label className="font-bold">Permission Name</Label>
          <div className="relative">
            <div className="absolute left-3 top-3 z-10">{getIcon()}</div>
            <Input
              autoFocus
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Enter permission name..."
              className="pl-12 h-12 border-primary/50 border-2"
              disabled={submitting}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="font-bold">Description (Optional)</Label>
          <div className="relative">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter permission description..."
              className="h-12 border-primary/50 border-2"
              disabled={submitting}
            />
          </div>
        </div>
      </div>

      {isAvailable === false && inputValue && (
        <p className="text-sm text-red-500">This permission already exists</p>
      )}

      <Button
        className="w-full font-bold"
        onClick={createPermission}
        disabled={isCreateDisabled}
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : isAvailable ? (
          `Create Permission '${inputValue}'`
        ) : (
          "Waiting for server 'OK'"
        )}
      </Button>
    </div>
  );
};

export default CreatePermission;
