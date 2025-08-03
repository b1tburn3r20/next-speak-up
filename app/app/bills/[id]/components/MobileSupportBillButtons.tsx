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
import { useBillPageStore } from "../useBillPageStore";
import { Vote, X } from "lucide-react";
import { useState } from "react";
import { SupportBillButton } from "./SupportBillButton";
const MobileSupportBillButtons = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const billData = useBillPageStore((f) => f.billData);
  return (
    <div className="container mx-auto max-w-4xl">
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button
            className="w-full h-12 text-base font-semibold shadow-lg"
            size="lg"
          >
            <Vote className="mr-2 h-5 w-5" />
            Take Action
          </Button>
        </DrawerTrigger>
        <DrawerContent className="overflow-y-hidden">
          <DrawerHeader className="text-center pb-4">
            <DrawerTitle className="text-xl font-bold">Take Action</DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">
              Your voice matters. Make your position heard on this legislation.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 flex-1 overflow-y-hidden">
            <div className="space-y-4">
              {/* Bill title in drawer for context */}
              <div className="bg-muted/50 rounded-lg p-4 overflow-y-hidden">
                <p className="text-sm font-medium line-clamp-3 overflow-y-hidden">
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
  );
};

export default MobileSupportBillButtons;
