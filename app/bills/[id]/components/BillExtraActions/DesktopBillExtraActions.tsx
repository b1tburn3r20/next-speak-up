"use client";

import { Button } from "@/components/ui/button";
import { useBillPageStore } from "../../useBillPageStore";
import { useReportBugStore } from "@/app/1Components/components/BugReporting/useReportBugStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FullLegislation } from "@/lib/types/bill-types";
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
import { useFeatureSuggestionStore } from "@/app/1Components/components/FeatureSuggestion/useFeatureSuggestion";

interface BillDeskTopExtraActionsProps {
  userId: string | null;
}

const DesktopBillExtraActions = ({ userId }: BillDeskTopExtraActionsProps) => {
  // zustand stores
  const billData = useBillPageStore((f) => f.billData);
  const setReportModalOpen = useReportBugStore((f) => f.setIsBugDialogOpen);
  const setIsFeatureSuggestionDialogOpen = useFeatureSuggestionStore(
    (f) => f.setIsFeatureSuggestionDialogOpen
  );
  //

  const handleReportBug = () => {
    // Close dropdown first, then open dialog
    setTimeout(() => {
      setReportModalOpen(true);
    }, 100);
  };

  const handleSuggestFeature = () => {
    // Close dropdown first, then open dialog
    setTimeout(() => {
      setIsFeatureSuggestionDialogOpen(true);
    }, 100);
  };

  const handleShareButtonClick = async () => {
    const shareData = {
      title: "Coolbills - Learn and Make Change",
      text: `Read about bill ${billData?.legislation?.title}`,
      url: `${billData?.legislation?.id}`,
    };

    await navigator.share(shareData);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleShareButtonClick}>
            Share Bill
            <DropdownMenuShortcut>
              <Share2Icon className="scale-75" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            Create Forum Post About
            <DropdownMenuShortcut>
              <PlusCircle className="scale-75" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            Message Your Legislators About This Bill
            <DropdownMenuShortcut>
              <Scroll />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleReportBug}>
            Report A Bug
            <DropdownMenuShortcut>
              <Bug className="text-red-500" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          {/* <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Email</DropdownMenuItem>
                <DropdownMenuItem>Message</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>More...</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub> */}
          <DropdownMenuItem onClick={handleSuggestFeature}>
            Suggest A Feature
            <DropdownMenuShortcut>
              <Smile />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          AI Summary Was Helpful
          <DropdownMenuShortcut>
            <ThumbsUp className="scale-75 text-green-500" />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          AI Summary Was Not Helpful
          <DropdownMenuShortcut>
            <ThumbsDown className="scale-75 text-red-500" />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DesktopBillExtraActions;
