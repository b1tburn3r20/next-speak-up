"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOnboardingStore } from "../useOnboardingStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { US_STATES } from "@/lib/constants/states";
import { Check, ChevronsUpDown, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const locationSchema = z.object({
  state: z.string().min(1, "Please select your state").optional(),
});

type FormData = z.infer<typeof locationSchema>;

const stateOptions = US_STATES.map((state) => ({
  value: state,
  label: state,
}));

export function LocationStep() {
  const { data: session, update } = useSession();
  const [open, setOpen] = useState(false);

  const state = useOnboardingStore((state) => state.state);
  const setState = useOnboardingStore((state) => state.setState);
  const isInitialized = useOnboardingStore((state) => state.isInitialized);
  const initializeFromUser = useOnboardingStore(
    (state) => state.initializeFromUser
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(locationSchema),
  });

  const updateState = async (newState: string) => {
    if (!isInitialized) return;
    if (newState === session?.user?.state) {
      setIsValid(true);
      return;
    }

    setIsUpdating(true);
    setIsValid(false);
    try {
      const response = await fetch("/api/user/settings/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await update();
      toast.success("Location updated successfully");
      setIsValid(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update location";
      toast.error(message);
      setState(session?.user?.state || "");
      setIsValid(false);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (session?.user && !isInitialized) {
      initializeFromUser(session.user);
    }
  }, [session?.user, isInitialized, initializeFromUser]);

  useEffect(() => {
    if (isInitialized && state) {
      form.setValue("state", state);
      setIsValid(true);
    }
  }, [isInitialized, state, form]);

  return (
    <div className="space-y-6 max-w-sm">
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">Why Share Your State? 🗺️</h3>
          <p className="text-sm text-muted-foreground">
            Knowing your state helps us connect you with your local
            representatives and show you relevant congressional information that
            matters to your area.
          </p>
        </CardContent>
      </Card>

      <Form {...form}>
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Your State</FormLabel>
                <div className="relative">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={isUpdating || !isInitialized}
                        className={cn(
                          "w-full justify-between",
                          isValid &&
                            field.value &&
                            "border-green-500 bg-green-500/10 text-green-500"
                        )}
                      >
                        {field.value
                          ? stateOptions.find(
                              (state) => state.value === field.value
                            )?.label
                          : "Choose your state"}
                        <div className="flex items-center">
                          {isValid && field.value && (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          )}
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search states..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No state found.</CommandEmpty>
                          <CommandGroup>
                            {stateOptions.map((state) => (
                              <CommandItem
                                key={state.value}
                                value={state.value}
                                onSelect={async (currentValue) => {
                                  field.onChange(currentValue);
                                  setState(currentValue);
                                  await updateState(currentValue);
                                  setOpen(false);
                                }}
                              >
                                {state.label}
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    field.value === state.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <FormDescription>
                  This helps us customize your experience with local
                  congressional information.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">What You'll Get ✨</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>Updates about your state's representatives</span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>Local congressional news and events</span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>Relevant voting and civic information</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
