import React from "react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "./useChatStore";
import ShinyButton from "@/components/ui/shiny-button";

const SUGGESTED_PROMPTS = [
  "Is this bill going to cost lots of money?",
  "Could this bill harm any groups of people?",
  "Why should I care about this bill?",
];

export const SuggestedPrompts = ({
  onPromptSelect,
}: {
  onPromptSelect: (prompt: string) => void;
}) => {
  return (
    <div className="p-4 border-t">
      <div className="text-sm text-muted-foreground mb-2">
        Suggested questions:
      </div>
      <div className="flex flex-col space-y-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <ShinyButton
            key={prompt}
            className="justify-start text-sm"
            onClick={() => onPromptSelect(prompt)}
          >
            {prompt}
          </ShinyButton>
        ))}
      </div>
    </div>
  );
};
