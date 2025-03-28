"use client";
import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { useOnboardingStore } from "../useOnboardingStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const usernameSchema = z.object({
  username: z.string().min(1, "Username is required").optional(),
});

type FormData = z.infer<typeof usernameSchema>;

export function UsernameStep() {
  const { data: session, update } = useSession();
  const username = useOnboardingStore((state) => state.username);
  const setUsername = useOnboardingStore((state) => state.setUsername);
  const [isUpdating, setIsUpdating] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: username || "",
    },
  });

  const updateUsername = async (newUsername: string) => {
    if (newUsername === session?.user?.username) return;
    setUsernameError(null);
    setIsUpdating(true);

    try {
      const response = await fetch("/api/user/settings/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes("already taken")) {
          setUsernameError(
            "This username is already taken. Please choose another one."
          );
          return;
        }
        throw new Error(errorText);
      }

      await update();
      toast.success("Username updated successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update username";
      toast.error(message);
      setUsername(session?.user?.username || "");
    } finally {
      setIsUpdating(false);
    }
  };
  useEffect(() => {
    if (session?.user?.username) {
      setUsername(session.user.username);
      form.setValue("username", session.user.username);
      setIsValid(true);
    }
  }, [session, setUsername, form]);

  return (
    <div className="space-y-6 max-w-sm">
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">Why Choose a Username? 🤔</h3>
          <p className="text-sm text-muted-foreground">
            Your username is how other members of the community will know you.
            It's like your digital name tag in our Congress Directory community!
          </p>
        </CardContent>
      </Card>

      <Form {...form}>
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pick a Username</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      placeholder="e.g., CitizenJane, DemocracyFan, VoterBob"
                      disabled={isUpdating}
                      className={cn(
                        isValid &&
                          !usernameError &&
                          field.value &&
                          "border-green-500 bg-green-500/10 text-green-500"
                      )}
                      onChange={(e) => {
                        field.onChange(e);
                        setUsername(e.target.value);
                        setUsernameError(null);
                        setIsValid(false);
                      }}
                      onBlur={async () => {
                        field.onBlur();
                        if (field.value) {
                          await updateUsername(field.value);
                        }
                      }}
                    />
                    {isValid && !usernameError && field.value && (
                      <CheckCircle className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  This is how you'll appear to others in the community.
                </FormDescription>
                <FormMessage />
                {usernameError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{usernameError}</AlertDescription>
                  </Alert>
                )}
              </FormItem>
            )}
          />
        </form>
      </Form>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">Quick Tips ✨</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>
                Make it memorable - choose something that represents you
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>Keep it friendly and appropriate for all audiences</span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>
                Don't worry too much - you can always change it in your settings
                later
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
