// UpdateStateDialog.tsx
import { useSession } from "next-auth/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type UpdateStateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detectedState: string;
  onStateUpdated?: (state: string) => void; // New callback prop
};

export function UpdateStateDialog({
  open,
  onOpenChange,
  detectedState,
  onStateUpdated,
}: UpdateStateDialogProps) {
  const { update } = useSession();

  const handleUpdateState = async () => {
    try {
      const response = await fetch("/api/user/settings/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: detectedState }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await update();
      onStateUpdated?.(detectedState); // Notify parent component
      toast.success("Location updated successfully");
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update location";
      toast.error(message);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update Your State?</AlertDialogTitle>
          <AlertDialogDescription>
            Your geolocation shows you're in {detectedState}, which is different
            from your profile state. Would you like to update your profile?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpdateState}>
            Update State
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
