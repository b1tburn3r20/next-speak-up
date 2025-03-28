"use client";
import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "./useOnboardingStore";
import { UsernameStep } from "./components/UsernameStep";
import { LocationStep } from "./components/LocationStep";
import { DemographicsStep } from "./components/DemographicsStep";
import { WelcomeStep } from "./components/WelcomeStep";
import { toast } from "sonner";
import { InitializeFavoritesStep } from "./components/InitializeFavorites";

const STEPS = [
  {
    title: "Ready to Speak Up?",
    description: "Speak Up Quickstart",
    Component: WelcomeStep,
  },
  {
    title: "Create Your Username",
    description: "Choose a unique username for your account.",
    Component: UsernameStep,
  },
  {
    title: "Location",
    description: "Tell us which state you're from.",
    Component: LocationStep,
  },
  {
    title: "Your Representatives",
    description: "Meet your congressional representatives.",
    Component: InitializeFavoritesStep,
  },
  {
    title: "Demographics",
    description: "Help us understand our community better.",
    Component: DemographicsStep,
  },
];

export function OnboardingModal() {
  const { data: session, update } = useSession();
  const currentStep = useOnboardingStore((state) => state.currentStep);
  const isOnboarding = useOnboardingStore((state) => state.isOnboarding);
  const username = useOnboardingStore((state) => state.username);
  const state = useOnboardingStore((state) => state.state);
  const ageRange = useOnboardingStore((state) => state.ageRange);
  const householdIncome = useOnboardingStore((state) => state.householdIncome);
  const setOnboardingStep = useOnboardingStore((state) => state.setStep);
  const setCurrentStep = useOnboardingStore((state) => state.setCurrentStep);
  const setOnboarding = useOnboardingStore((state) => state.setOnboarding);

  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (session?.user?.needsOnboarding) {
      setOnboarding(true);
    }
  }, [session, setOnboarding]);

  const handleCloseAttempt = () => {
    setShowAlert(true);
  };

  const toggleOnboardingStatus = async () => {
    try {
      const response = await fetch("/api/user/onboarding", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update onboarding status");
      }

      await update();
    } catch (error) {
      console.error("Error updating onboarding status:", error);
      throw error;
    }
  };

  const handleConfirmedClose = async () => {
    try {
      await toggleOnboardingStatus();
      setOnboarding(false);
      setShowAlert(false);
      toast.success("You can always complete onboarding later in settings");
    } catch (error) {
      toast.error("Failed to update preferences");
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        // Just toggle onboarding status since data is already saved
        await toggleOnboardingStatus();
        await update();
        setOnboarding(false);
        toast.success("Setup completed successfully!");
      } catch (error) {
        console.error("Failed to complete onboarding:", error);
        toast.error("Failed to complete setup");
      }
    }
  };

  if (!isOnboarding) return null;

  const CurrentStepComponent = STEPS[currentStep].Component;

  return (
    <>
      <Dialog open={isOnboarding} onOpenChange={handleCloseAttempt}>
        <DialogContent className="max-w-screen-xl w-fit">
          <DialogHeader>
            <DialogTitle>{STEPS[currentStep].title}</DialogTitle>
            <DialogDescription>
              {STEPS[currentStep].description}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNext} className="space-y-4">
            <CurrentStepComponent />
            <div className="flex justify-between space-x-2">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                className={currentStep === 0 ? "w-full" : "flex-1"}
              >
                {currentStep === STEPS.length - 1 ? "All Finished!" : "Next"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Not Interested? No Problem. 😎✌️
            </AlertDialogTitle>
            <AlertDialogDescription>
              We understand your time is valuable. You can always come back to
              it. We won't ask you again, but if you want to come back and fill
              it out later, you can do so in your account settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Setup</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedClose}>
              Skip for Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
