"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { OuterBlock, PageHeader } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import CreateFormLogin from "./create-form-login";
import CreateForumPostUsernameSelect from "./create-forum-post-username-select";
import NewFormSubmitButton from "../create-forum-post/components/new-form-submit-button";
import NewForumPostForm from "../create-forum-post/components/new-forum-post-form";
import NewForumPostMessage from "../create-forum-post/components/new-forum-post-message";
import { useNewForumPostStore } from "../create-forum-post/use-new-forum-post-store";

/** The forum's header. Writing a post happens right here, above the list, not on another page. */
export function ForumComposerArea({
  userId,
  username,
  startOpen = false,
  bill = null,
}: {
  userId?: string;
  username?: string;
  startOpen?: boolean;
  /** A bill someone came from to talk about it. Its post starts with the bill's name and the right type. */
  bill?: { label: string; title: string } | null;
}) {
  const [name, setName] = useState(username);
  const [open, setOpen] = useState(Boolean(startOpen && userId && username));
  const resetStore = useNewForumPostStore((store) => store.resetStore);
  const setTitle = useNewForumPostStore((store) => store.setTitle);
  const setType = useNewForumPostStore((store) => store.setType);

  // The form clears itself when it opens, and a child's effect runs before this one, so this wins.
  useEffect(() => {
    if (!open || !bill) return;
    setType("Bill Discussion");
    setTitle(`${bill.label}: ${bill.title}`.slice(0, 180));
  }, [open, bill, setTitle, setType]);

  const close = () => {
    resetStore();
    setOpen(false);
  };

  let action: React.ReactNode;
  if (!userId) action = <CreateFormLogin />;
  else if (!name) action = <CreateForumPostUsernameSelect onUsernameCreation={(value: string) => setName(value)} />;
  else if (open) {
    action = (
      <Button variant="secondary" onClick={close} data-testid="composer-cancel">
        <X className="size-4" aria-hidden />
        Cancel
      </Button>
    );
  } else {
    action = (
      <Button className="font-bold" onClick={() => setOpen(true)} data-testid="composer-open">
        <Plus className="size-4" aria-hidden />
        Create
      </Button>
    );
  }

  return (
    <>
      <PageHeader title="Forum" description="Talk about bills and the app with other people." action={action} />
      {open ? (
        <OuterBlock className="space-y-3" data-testid="forum-composer">
          <NewForumPostMessage />
          <NewForumPostForm />
          <NewFormSubmitButton />
        </OuterBlock>
      ) : null}
    </>
  );
}
