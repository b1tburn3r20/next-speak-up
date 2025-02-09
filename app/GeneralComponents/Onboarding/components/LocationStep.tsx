"use client";
import { useState, useEffect, use } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOnboardingStore } from "../useOnboardingStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { US_STATES } from "@/lib/constants/states";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const locationSchema = z.object({
  state: z.string().min(1, "Please select your state").optional(),
});

type FormData = z.infer<typeof locationSchema>;

export function LocationStep() {
  const { data: session, update } = useSession();

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

  // Initialize store from session data
  useEffect(() => {
    if (session?.user && !isInitialized) {
      initializeFromUser(session.user);
    }
  }, [session?.user, isInitialized, initializeFromUser]);

  // Set form value after initialization
  useEffect(() => {
    if (isInitialized && state) {
      form.setValue("state", state);
      setIsValid(true);
    }
  }, [isInitialized, state, form]);

  return (
    <div className="space-y-6">
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
                  <Select
                    disabled={isUpdating || !isInitialized}
                    onValueChange={async (value) => {
                      field.onChange(value);
                      setState(value);
                      await updateState(value);
                    }}
                    value={field.value || state || ""}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          isValid &&
                            field.value &&
                            "border-green-500 bg-green-500/10 text-green-500"
                        )}
                      >
                        <SelectValue placeholder="Choose your state" />
                        {isValid && field.value && (
                          <CheckCircle className="h-4 w-4 text-green-500 absolute right-8 top-2.5" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
