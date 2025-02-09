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
import { AgeRange, IncomeRange } from "@prisma/client";
import { formatAgeRange, formatIncomeRange } from "@/lib/utils/StringFunctions";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const demographicsSchema = z.object({
  ageRange: z.nativeEnum(AgeRange).optional(),
  householdIncome: z.nativeEnum(IncomeRange).optional(),
});

type FormData = z.infer<typeof demographicsSchema>;

export function DemographicsStep() {
  const { data: session, update } = useSession();

  const ageRange = useOnboardingStore((state) => state.ageRange);
  const householdIncome = useOnboardingStore((state) => state.householdIncome);
  const setAgeRange = useOnboardingStore((state) => state.setAgeRange);
  const setHouseholdIncome = useOnboardingStore(
    (state) => state.setHouseholdIncome
  );
  const isInitialized = useOnboardingStore((state) => state.isInitialized);
  const initializeFromUser = useOnboardingStore(
    (state) => state.initializeFromUser
  );

  const [isUpdating, setIsUpdating] = useState(false);
  const [isAgeValid, setIsAgeValid] = useState(false);
  const [isIncomeValid, setIsIncomeValid] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(demographicsSchema),
  });

  const updateDemographics = async (
    field: "ageRange" | "householdIncome",
    value: string
  ) => {
    if (!isInitialized) return;

    setIsUpdating(true);
    const setValid = field === "ageRange" ? setIsAgeValid : setIsIncomeValid;
    setValid(false);

    try {
      const response = await fetch("/api/user/settings/demographics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await update();
      toast.success("Demographics updated successfully");
      setValid(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update demographics";
      toast.error(message);

      if (field === "ageRange") {
        setAgeRange(session?.user?.ageRange || "");
      } else {
        setHouseholdIncome(session?.user?.householdIncome || "");
      }
      setValid(false);
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

  // Set form values after initialization
  useEffect(() => {
    if (isInitialized) {
      if (ageRange) {
        form.setValue("ageRange", ageRange as AgeRange);
        setIsAgeValid(true);
      }
      if (householdIncome) {
        form.setValue("householdIncome", householdIncome as IncomeRange);
        setIsIncomeValid(true);
      }
    }
  }, [isInitialized, ageRange, householdIncome, form]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">Your Data is YOUR Data. 🔒</h3>
          <p className="text-sm text-muted-foreground">
            In this day and age, data is everything. And everyone wants it, one
            of Speak Up's key values is to be transparent about what data we
            collect and why. We want to make sure that you are comfortable with
            the data we collect and how we use it. Not only will we will never
            sell your data to third parties, the data we collect on you is not
            personal identifiable information, meaning companies cant use it to
            track you down. We believe if we dont store sensitive data, we cant
            have sensitive data leaks. So fear not, none if this information is
            dangerous.
          </p>
        </CardContent>
      </Card>

      <Form {...form}>
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="ageRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age Range</FormLabel>
                <div className="relative">
                  <Select
                    disabled={isUpdating || !isInitialized}
                    onValueChange={async (value) => {
                      field.onChange(value);
                      setAgeRange(value);
                      await updateDemographics("ageRange", value);
                    }}
                    value={field.value || ageRange || ""}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          isAgeValid &&
                            field.value &&
                            "border-green-500 bg-green-500/10 text-green-500"
                        )}
                      >
                        <SelectValue placeholder="Select your age range" />
                        {isAgeValid && field.value && (
                          <CheckCircle className="h-4 w-4 text-green-500 absolute right-8 top-2.5" />
                        )}
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
                </div>
                <FormDescription>
                  Helps us show you policies affecting your age group.
                </FormDescription>
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
                <div className="relative">
                  <Select
                    disabled={isUpdating || !isInitialized}
                    onValueChange={async (value) => {
                      field.onChange(value);
                      setHouseholdIncome(value);
                      await updateDemographics("householdIncome", value);
                    }}
                    value={field.value || householdIncome || ""}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          isIncomeValid &&
                            field.value &&
                            "border-green-500 bg-green-500/10 text-green-500"
                        )}
                      >
                        <SelectValue placeholder="Select your household income range" />
                        {isIncomeValid && field.value && (
                          <CheckCircle className="h-4 w-4 text-green-500 absolute right-8 top-2.5" />
                        )}
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
                </div>
                <FormDescription>
                  This helps us show you policies affecting your income group.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
