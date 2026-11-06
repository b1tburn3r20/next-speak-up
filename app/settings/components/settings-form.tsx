// app/settings/components/SettingsForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgeRange, IncomeRange } from "@prisma/client";
import { formatAgeRange, formatIncomeRange } from "@/lib/utils/string-functions";
import { useState } from "react";
import { toast } from "sonner";
import { US_STATES } from "@/lib/constants/states";
import DistrictSelect from "@/components/cb/district-selector";
import { X } from "lucide-react";

interface SettingsFormProps {
  id: string;
  name: string | null;
  username: string | null;
  state: string | null;
  district: string | null;
  ageRange: AgeRange | null;
  householdIncome: IncomeRange | null;

}

export function SettingsForm({
  id,
  name,
  username,
  state,
  district,
  ageRange,
  householdIncome,
}: SettingsFormProps) {
  const [loading, setLoading] = useState(false);

  const [formValues, setFormValues] = useState({
    name,
    username,
    state,
    district,
    ageRange,
    householdIncome,
  });

  const [initialValues] = useState({ ...formValues });

  const isDirty = JSON.stringify(formValues) !== JSON.stringify(initialValues);

  function handleChange<K extends keyof typeof formValues>(
    key: K,
    value: (typeof formValues)[K]
  ) {
    setFormValues((prev) => {
      if (key === "state") {
        return { ...prev, state: value as string, district: null };
      }
      return { ...prev, [key]: value };
    });
  }

  function handleClear<K extends keyof typeof formValues>(key: K) {
    setFormValues((prev) => {
      if (key === "state") {
        return { ...prev, state: null, district: null };
      }
      return { ...prev, [key]: null };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty) return;
    setLoading(true);

    try {
      const changedData: Partial<typeof formValues> & { id: string } = { id };

      (Object.keys(formValues) as (keyof typeof formValues)[]).forEach((key) => {
        if (formValues[key] !== initialValues[key]) {
          (changedData as any)[key] = formValues[key];
        }
      });

      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changedData),
      });

      if (!response.ok) throw new Error(await response.text());

      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Identity */}
      <div className="space-y-2">
        <Label htmlFor="settings-name">Name</Label>
        <div className="flex gap-2">
          <Input
            id="settings-name"
            placeholder="Your name"
            value={formValues.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
          />
          {formValues.name && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleClear("name")}
              aria-label="Clear name"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="settings-username">Username</Label>
        <div className="flex gap-2">
          <Input
            id="settings-username"
            placeholder="Username"
            value={formValues.username || ""}
            onChange={(e) => handleChange("username", e.target.value)}
          />
          {formValues.username && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleClear("username")}
              aria-label="Clear username"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="settings-state">State</Label>
        <div className="flex gap-2">
          <Select
            value={formValues.state || ""}
            onValueChange={(val) => handleChange("state", val)}
          >
            <SelectTrigger id="settings-state" className="w-full min-w-0 flex-1">
              <SelectValue placeholder="Select a state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formValues.state && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleClear("state")}
              aria-label="Clear state"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>District</Label>
        <div className="flex gap-2">
          <DistrictSelect
            state={formValues.state}
            value={formValues.district}
            onValueChange={(val) => handleChange("district", val)}
          />
          {formValues.district && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleClear("district")}
              aria-label="Clear district"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Demographics */}
      <div className="space-y-2">
        <Label htmlFor="settings-age">Age range</Label>
        <div className="flex gap-2">
          <Select
            value={formValues.ageRange || ""}
            onValueChange={(val) => handleChange("ageRange", val as AgeRange)}
          >
            <SelectTrigger id="settings-age" className="w-full min-w-0 flex-1">
              <SelectValue placeholder="Select age range" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(AgeRange).map((range) => (
                <SelectItem key={range} value={range}>
                  {formatAgeRange(range)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formValues.ageRange && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleClear("ageRange")}
              aria-label="Clear age range"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="settings-income">Household income</Label>
        <div className="flex gap-2">
          <Select
            value={formValues.householdIncome || ""}
            onValueChange={(val) => handleChange("householdIncome", val as IncomeRange)}
          >
            <SelectTrigger id="settings-income" className="w-full min-w-0 flex-1">
              <SelectValue placeholder="Select household income" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(IncomeRange).map((range) => (
                <SelectItem key={range} value={range}>
                  {formatIncomeRange(range)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formValues.householdIncome && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleClear("householdIncome")}
              aria-label="Clear household income"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Button type="submit" disabled={loading || !isDirty}>
        {loading ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
