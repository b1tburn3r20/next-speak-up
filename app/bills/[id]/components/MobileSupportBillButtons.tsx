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
    </div>
  );
};

export default MobileSupportBillButtons;
