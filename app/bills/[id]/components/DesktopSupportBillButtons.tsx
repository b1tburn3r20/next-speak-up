"use client";

import { ShimmerButton } from "@/components/magicui/shimmer-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState } from "react";
import { useBillPageStore } from "../useBillPageStore";
import { SupportBillButton } from "./SupportBillButton";
const DesktopSupportBillButtons = () => {
  const [open, setOpen] = useState(false);
  const billData = useBillPageStore((s) => s.billData);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ShimmerButton className="shadow-2xl  w-full max-w-4xl fixed">
          <span className="whitespace-pre-wrap text-center text-xl font-extrabold leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
            Vote
          </span>
        </ShimmerButton>
      </DialogTrigger>
      <DialogContent
        hideCloseButton
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="shadow-none h-[90vh] max-w-7xl bg-transparent border-none"
      >
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle className="">
              {billData?.legislation.title}
            </DialogTitle>
          </DialogHeader>
        </VisuallyHidden>
        <div className="flex flex-col text-center  justify-between items-center">
          <div className="relative">
            <div className="absolute inset-0 z-0"></div>
            {/* Blurry overlay */}
            <div className="relative z-10 p-6 rounded-2xl bg-black/15 backdrop-blur-md ">
              <p className="text-white font-bold text-3xl">
                {billData.legislation.title}
              </p>
            </div>
          </div>

          <SupportBillButton bill={billData.legislation} />
          <div />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DesktopSupportBillButtons;
