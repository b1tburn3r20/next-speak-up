"use client";
import { useLoginStore } from "../../navbar/useLoginStore";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
const CreateFormLogin = () => {
  const setIsLoginDialogOpen = useLoginStore((f) => f.setIsLoginDialogOpen);
  return (
    <Button className="font-bold" onClick={() => setIsLoginDialogOpen(true)}>
      <Plus /> Create
    </Button>
  );
};

export default CreateFormLogin;
