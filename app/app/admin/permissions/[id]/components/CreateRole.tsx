"use client";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { CircleCheck, CircleX, Loader2, ShieldPlus, Smile } from "lucide-react";
import { useState, useCallback } from "react";
import { debounce } from "lodash";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Role } from "@prisma/client";

const CreateRole = () => {
  const [inputValue, setInputValue] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState("");

  const checkIfRoleIsAvailable = async (value: string) => {
    if (!value.trim()) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch(
        `/api/admin/roles/check-role?roleName=${encodeURIComponent(value)}`
      );
      const data = await response.json();

      if (response.ok) {
        // If role exists, it's NOT available for creation
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

  const CreateRole = async () => {
    if (!inputValue.trim() || !isAvailable) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/roles/create-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleName: inputValue.trim(),
          description: description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setInputValue("");
        setDescription("");
        setIsAvailable(null);
        toast.success(`Role: ${data.role.name} created.`);
      } else {
        console.error("Failed to create role:", data);
        toast.error("Seems like something went wrong...");
      }
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Debounce the API call to avoid too many requests
  const debouncedCheck = useCallback(debounce(checkIfRoleIsAvailable, 500), []);

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
          <Label className="font-bold">Role Name</Label>
          <div className="relative">
            <div className="absolute left-3 top-3 z-10">{getIcon()}</div>
            <Input
              autoFocus
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Enter role name..."
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
              placeholder="Enter role description..."
              className="h-12 border-primary/50 border-2"
              disabled={submitting}
            />
          </div>
        </div>
      </div>

      {isAvailable === false && inputValue && (
        <p className="text-sm text-red-500">This role already exists</p>
      )}

      <Button
        className="w-full font-bold"
        onClick={CreateRole}
        disabled={isCreateDisabled}
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : isAvailable ? (
          `Create role '${inputValue}'`
        ) : (
          "Waiting for server 'OK'"
        )}
      </Button>
    </div>
  );
};

export default CreateRole;
