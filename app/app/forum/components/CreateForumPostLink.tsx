"use client";

import Link from "next/link";
import CreateFormLogin from "./CreateFormLogin";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreateForumPostUsernameSelect from "./CreateForumPostUsernameSelect";
import { useState } from "react";
interface CreateForumPostLinkProps {
  userId?: string;
  username?: string;
}
const CreateForumPostLink = ({
  userId,
  username,
}: CreateForumPostLinkProps) => {
  const [userName, setUserName] = useState(username);

  if (!userId) return <CreateFormLogin />;
  if (userId && !userName)
    return (
      <CreateForumPostUsernameSelect
        onUsernameCreation={(val: string) => setUserName(val)}
      />
    );
  return (
    <Link href="/forum/create-forum-post">
      <Button className="font-bold">
        <Plus /> Create
      </Button>
    </Link>
  );
};

export default CreateForumPostLink;
