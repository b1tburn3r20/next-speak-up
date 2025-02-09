// components/onboarding/WelcomeStep.tsx
"use client";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function WelcomeStep() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Hello, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground">
          We're excited to have you join our community.
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">What's Next?</h3>
            <p className="text-sm text-muted-foreground">
              We'll help you set up your profile in just a few quick steps:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li>Create your unique username</li>
              <li>Tell us where you're from</li>
              <li>Share a bit about yourself</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">Why This Matters</h3>
            <p className="text-sm text-muted-foreground">
              This information helps us:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li>Customize your experience</li>
              <li>Show you relevant congressional information</li>
              <li>Connect you with your local representatives</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Don't worry! All fields are optional and you can always update them
        later.
      </p>
    </div>
  );
}
