"use client";

import { useUserStore } from "@/app/admin/stores/useUserStore";
import { useLoginStore } from "@/app/navbar/useLoginStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import StateAndDistrictComboBox from "./StateAndDistrict/StateAndDistrictComboBox";
import DistrictSelect from "./StateAndDistrict/DistrictSelect";
import FindMyStateAndDistrictButton from "./FindMyStateAndDistrictButton";

const StateAndDistrictSelectDialog = () => {
  const open = useLoginStore((f) => f.isStateDistrictDialogOpen);
  const setOpen = useLoginStore((f) => f.setIsStateDistrictDialogOpen);
  const usersState = useUserStore((f) => f.userState);
  const usersDistrict = useUserStore((f) => f.userDistrict);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>State & District Select</DialogTitle>
          <DialogDescription>
            Selecting your state and district allows us to find your congress
            members and help you find the information you want faster.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Label>State</Label>
            <StateAndDistrictComboBox />
          </div>
          <div className="flex flex-col gap-2">
            <Label>District</Label>

            <DistrictSelect />
          </div>
          <FindMyStateAndDistrictButton />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StateAndDistrictSelectDialog;
