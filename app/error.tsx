"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-3 p-8 text-center font-normal">
      <h1 className="text-xl font-semibold">Something went wrong on this page</h1>
      <p className="text-sm text-muted-foreground">
        The rest of the site should still work. Trying again often fixes this.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
