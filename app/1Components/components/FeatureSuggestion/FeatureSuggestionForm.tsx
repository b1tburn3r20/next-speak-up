"use client";
import { Label } from "@/components/ui/label";
import { useFeatureSuggestionStore } from "./useFeatureSuggestion";
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

const FeatureReportForm = () => {
  const open = useFeatureSuggestionStore(
    (f) => f.isFeatureSuggestionDialogOpen
  );
  const setOpen = useFeatureSuggestionStore(
    (f) => f.setIsFeatureSuggestionDialogOpen
  );
  const setFeature = useFeatureSuggestionStore((f) => f.setFeature);
  const resetFeatureSuggestionStore = useFeatureSuggestionStore(
    (f) => f.resetFeatureSuggestionStore
  );
  const feature = useFeatureSuggestionStore((f) => f.feature);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const pathWhereBugSubmitted = usePathname();

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
      const response = await fetch("/api/feature-suggestion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feature,
          pathWhereBugSubmitted,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Feature suggestion submitted successfully!");
        resetFeatureSuggestionStore();
        setOpen(false);
      } else {
        toast.error(data.error || "Failed to submit feature suggestion");
      }
    } catch (error) {
      console.error("Error submitting feature suggestion:", error);
      toast.error("Failed to submit feature suggestion");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suggest a feature?</DialogTitle>
          <DialogDescription>
            Like to suggest a feature to be added to the the application? We'd
            love to hear it. Please describe the feature you think would add
            value to Together below.
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className="gap-2 flex flex-col">
            <Label>Describe the feature</Label>
            <Textarea
              value={feature}
              className="min-h-24"
              onChange={(e) => setFeature(e.target.value)}
              placeholder="please describe the feature you'd like to see..."
            />
            <Button
              className="h-10 text-lg"
              disabled={feature.length < 15 || isSubmitting}
              onClick={handleSubmit}
              asChild
            >
              <div>
                {isSubmitting ? (
                  <div className="flex gap-1 items-center">
                    <p>Submitting...</p>
                    <Loader2 className="animate-spin" />
                  </div>
                ) : (
                  <p>Submit Feature Request</p>
                )}{" "}
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureReportForm;
