import React from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useChatStore } from "./useChatStore";
export const ChatSettings = () => {
  const settings = useChatStore((state) => state.settings);
  const updateSettings = useChatStore((state) => state.updateSettings);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Open settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <h4 className="font-medium leading-none">Chat Settings</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <Label
                htmlFor="long-responses"
                className="flex flex-col space-y-1"
              >
                <span>Long Responses</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Receive detailed, comprehensive answers
                </span>
              </Label>
              <Switch
                id="long-responses"
                checked={settings.longResponses}
                onCheckedChange={(checked) =>
                  updateSettings({ longResponses: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label
                htmlFor="advanced-language"
                className="flex flex-col space-y-1"
              >
                <span>Advanced Language</span>
                <span className="font-normal text-sm text-muted-foreground">
                  More likely to use technical terms, advanced political lingua.
                </span>
              </Label>
              <Switch
                id="advanced-language"
                checked={settings.advancedLanguage}
                onCheckedChange={(checked) =>
                  updateSettings({ advancedLanguage: checked })
                }
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
