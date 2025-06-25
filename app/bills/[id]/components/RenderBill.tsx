"use client";

import LoadingCatch from "@/app/GeneralComponents/Onboarding/components/LoadingCatch";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { FullUserLegislationData } from "@/lib/types/bill-types";
import { Vote, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useBillPageStore } from "../useBillPageStore";
import BillSummariesContainer from "./BillSummariesContainer";
import BillTitle from "./BillTitle";
import HasVotedBillPage from "./has-voted-components/HasVotedBillPage";
import { SupportBillButton } from "./SupportBillButton";

interface RenderBillProps {
  bill: FullUserLegislationData;
  session: any;
  isDyslexicFriendly: boolean;
}

const RenderBill = ({ bill, session, isDyslexicFriendly }: RenderBillProps) => {
  const billData = useBillPageStore((f) => f.billData);
  const setBillData = useBillPageStore((s) => s.setBillData);
  const setIsDyslexicFriendly = useBillPageStore(
    (e) => e.setIsDyslexicFriendly
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setBillData(bill);
    setIsDyslexicFriendly(isDyslexicFriendly);
  }, []);

  const hasUser = session?.user?.id;

  if (!billData) {
    return <LoadingCatch />;
  }
  const hasVoted = !!billData?.userVote;

  if (hasVoted) {
    return <HasVotedBillPage session={session} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content Container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Bill Content Card */}
          <div className="bg-card border rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              {/* Bill Title Section */}
              <div className="text-center">
                <BillTitle />
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Bill Summaries Section */}
              <div>
                <BillSummariesContainer userId={session?.user?.id} />
              </div>
            </div>
          </div>

          {/* Support Button - Drawer on mobile, inline on desktop */}
          {hasUser && (
            <>
              {/* Mobile: Drawer trigger button */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border sm:hidden z-50">
                <div className="container mx-auto max-w-4xl">
                  <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <DrawerTrigger asChild>
                      <Button
                        className="w-full h-12 text-base font-semibold shadow-lg"
                        size="lg"
                      >
                        <Vote className="mr-2 h-5 w-5" />
                        Cast Your Vote
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="max-h-[85vh]">
                      <DrawerHeader className="text-center pb-4">
                        <DrawerTitle className="text-xl font-bold">
                          Cast Your Vote
                        </DrawerTitle>
                        <DrawerDescription className="text-sm text-muted-foreground">
                          Your voice matters. Make your position heard on this
                          legislation.
                        </DrawerDescription>
                      </DrawerHeader>

                      <div className="px-4 pb-4 flex-1 overflow-y-auto">
                        <div className="space-y-4">
                          {/* Bill title in drawer for context */}
                          <div className="bg-muted/50 rounded-lg p-4">
                            <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                              VOTING ON
                            </h3>
                            <p className="text-sm font-medium line-clamp-3">
                              {billData.legislation.title}
                            </p>
                          </div>

                          {/* Support button component */}
                          <div className="pt-2">
                            <SupportBillButton
                              bill={billData.legislation}
                              onVoteSuccess={() => setIsDrawerOpen(false)}
                            />
                          </div>
                        </div>
                      </div>

                      <DrawerFooter className="pt-4">
                        <DrawerClose asChild>
                          <Button variant="outline" className="w-full">
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>
                </div>
              </div>

              {/* Desktop: Inline button */}
              <div className="hidden sm:block mt-6 text-center">
                <SupportBillButton bill={billData.legislation} />
              </div>

              {/* Spacer for fixed button on mobile */}
              <div className="h-20 sm:hidden" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RenderBill;
