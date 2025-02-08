// app/settings/components/SettingsForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgeRange, IncomeRange } from "@prisma/client";
import { formatAgeRange, formatIncomeRange } from "@/lib/utils/StringFunctions";
import { useState } from "react";
import { toast } from "sonner";
import { US_STATES } from "@/lib/constants/states";
const formSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  username: z.string().nullable(),
  email: z.string().email().nullable(),
  state: z.string().nullable(),
  ageRange: z.nativeEnum(AgeRange).nullable(),
  householdIncome: z.nativeEnum(IncomeRange).nullable(),
});

type SettingsFormValues = z.infer<typeof formSchema>;

interface SettingsFormProps {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  state: string | null;
  ageRange: AgeRange | null;
  householdIncome: IncomeRange | null;
}

export function SettingsForm({
  id,
  name,
  username,
  email,
  state,
  ageRange,
  householdIncome,
}: SettingsFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id,
      name,
      username,
      email,
      state,
      ageRange,
      householdIncome,
    },
  });

  async function onSubmit(data: SettingsFormValues) {
    setLoading(true);
    try {
      // Get the dirty fields from the form
      const dirtyFields = form.formState.dirtyFields;

      // Create an object containing only the changed fields
      const changedData = Object.keys(dirtyFields).reduce((acc, key) => {
        if (dirtyFields[key]) {
          acc[key] = data[key as keyof SettingsFormValues];
        }
        return acc;
      }, {} as Partial<SettingsFormValues>);

      // Always include the ID
      changedData.id = id;

      // Only make the API call if there are actually changed fields
      if (Object.keys(changedData).length > 1) {
        // > 1 because id is always included
        const response = await fetch("/api/user/settings", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(changedData),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        toast.success("Settings updated successfully");

        // Reset the dirty state for the submitted fields
        form.reset(data);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update settings");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your name"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  placeholder="Username"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Email"
                  type="email"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a state" />
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ageRange"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age Range</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(AgeRange).map((range) => (
                    <SelectItem key={range} value={range}>
                      {formatAgeRange(range)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="householdIncome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Household Income</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select household income" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(IncomeRange).map((range) => (
                    <SelectItem key={range} value={range}>
                      {formatIncomeRange(range)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading || !form.formState.isDirty}>
          {loading ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </Form>
  );
}
