"use client";
import { Label } from "@/components/ui/label";
import { useReportBugStore } from "./useReportBugStore";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const BugReportForm = () => {
  const open = useReportBugStore((f) => f.isBugDialogOpen);
  const setOpen = useReportBugStore((f) => f.setIsBugDialogOpen);
  const setBug = useReportBugStore((f) => f.setBug);
  const resetBugStore = useReportBugStore((f) => f.resetBugStore);
  const bug = useReportBugStore((f) => f.bug);
  const [isSubmitting, setIsSubmitting] = useState(false);

  //
  const pathWhereBugSubmitted = usePathname();
  //

  const handleOpenChange = () => {
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bug-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bug,
          pathWhereBugSubmitted,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Bug report submitted successfully!");
        resetBugStore();
        setOpen(false);
      } else {
        toast.error(data.error || "Failed to submit bug report");
      }
    } catch (error) {
      console.error("Error submitting bug report:", error);
      toast.error("Failed to submit bug report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a bug?</DialogTitle>
          <DialogDescription>
            If you found a bug please describe what you were doing to get this
            bug. Thank you for taking the time to look into this feature we
            appreciate it very much.
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className="gap-2 flex flex-col">
            <Label>Describe the bug</Label>
            <Textarea
              value={bug}
              className="min-h-24"
              onChange={(e) => setBug(e.target.value)}
              placeholder="please explain what you were doing and what happened..."
            />
            <Button
              onClick={handleSubmit}
              className="h-10 text-lg"
              asChild
              disabled={bug.length < 15 || isSubmitting}
            >
              <div>
                {isSubmitting ? (
                  <div className="flex gap-1 items-center">
                    <p>Submitting...</p>
                    <Loader2 className="animate-spin" />
                  </div>
                ) : (
                  <p>Submit Bug</p>
                )}
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BugReportForm;
