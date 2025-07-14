"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useBillPageStore } from "../../useBillPageStore";
import { useReportBugStore } from "@/app/1Components/components/BugReporting/useReportBugStore";
import { useFeatureSuggestionStore } from "@/app/1Components/components/FeatureSuggestion/useFeatureSuggestion";
import {
  Bug,
  EllipsisVertical,
  PlusCircle,
  Scroll,
  Share2Icon,
  Smile,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";

interface MobileBillExtraActionsProps {
  userId: string | null;
}

const MobileBillExtraActions = ({ userId }: MobileBillExtraActionsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // zustand stores
  const billData = useBillPageStore((f) => f.billData);
  const setReportModalOpen = useReportBugStore((f) => f.setIsBugDialogOpen);
  const setIsFeatureSuggestionDialogOpen = useFeatureSuggestionStore(
    (f) => f.setIsFeatureSuggestionDialogOpen
  );

  const handleReportBug = () => {
    setIsDialogOpen(false);
    // Wait for dialog to fully close before opening bug report dialog
    setTimeout(() => {
      setReportModalOpen(true);
    }, 200);
  };

  const handleSuggestFeature = () => {
    setIsDialogOpen(false);
    // Wait for dialog to fully close before opening feature suggestion dialog
    setTimeout(() => {
      setIsFeatureSuggestionDialogOpen(true);
    }, 200);
  };

  const handleShareButtonClick = async () => {
    setIsDialogOpen(false);
    const shareData = {
      title: "Coolbills - Learn and Make Change",
      text: `Read about bill ${billData?.legislation?.title}`,
      url: `${billData?.legislation?.id}`,
    };

    await navigator.share(shareData);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="icon">
          <EllipsisVertical />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bill Actions</DialogTitle>
          <DialogDescription>Choose an action for this bill.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleShareButtonClick}
          >
            <Share2Icon className="h-4 w-4" />
            Share Bill
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            disabled
          >
            <PlusCircle className="h-4 w-4" />
            Create Forum Post About
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            disabled
          >
            <Scroll className="h-4 w-4" />
            Message Your Legislators About This Bill
          </Button>

          <div className="border-t pt-2 mt-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleReportBug}
            >
              <Bug className="h-4 w-4 text-red-500" />
              Report A Bug
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 mt-2"
              onClick={handleSuggestFeature}
            >
              <Smile className="h-4 w-4" />
              Suggest A Feature
            </Button>
          </div>

          <div className="border-t pt-2 mt-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              disabled
            >
              <ThumbsUp className="h-4 w-4 text-green-500" />
              AI Summary Was Helpful
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 mt-2"
              disabled
            >
              <ThumbsDown className="h-4 w-4 text-red-500" />
              AI Summary Was Not Helpful
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileBillExtraActions;
