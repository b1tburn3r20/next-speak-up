import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useChatStore } from "./useChatStore";

export const ContextWindow = () => {
  const contextWindow = useChatStore((state) => state.contextWindow);

  if (!contextWindow) return null;

  return (
    <Card className="mb-4 bg-muted/50">
      <CardContent className="p-3">
        <p className="text-sm text-muted-foreground">{contextWindow}</p>
      </CardContent>
    </Card>
  );
};
