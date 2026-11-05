"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useDialogStore } from "@/app/stores/use-dialog-store";
import UsernameSelectDialog from "@/app/GeneralComponents/Onboarding/components/componentsA/username-select-dialog";

interface CreateForumPostUsernameSelectProps {
  onUsernameCreation: (username: string) => void;
}

const CreateForumPostUsernameSelect = ({
  onUsernameCreation,
}: CreateForumPostUsernameSelectProps) => {
  const setIsUsernameSelectDialogOpen = useDialogStore(
    (state) => state.setIsUsernameSelectDialogOpen
  );

  const handleCreateClick = () => {
    setIsUsernameSelectDialogOpen(true);
  };

  return (
    <>
      <Button className="font-bold" onClick={handleCreateClick}>
        <Plus /> Create
      </Button>
      <UsernameSelectDialog onUsernameCreation={onUsernameCreation} />
    </>
  );
};

export default CreateForumPostUsernameSelect;
