"use client";

import React from "react";
import Link from "next/link";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

interface NextVoteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NextVoteDrawer({ open, onOpenChange }: NextVoteDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-96 flex items-center justify-center">
        <Link
          href="/"
          className="text-4xl font-bold w-full h-full flex items-center justify-center"
        >
          Next
        </Link>
      </DrawerContent>
    </Drawer>
  );
}
