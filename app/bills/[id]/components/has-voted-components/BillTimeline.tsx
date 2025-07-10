"use client";

import { useMemo } from "react";
import { CheckCircle } from "lucide-react";
import { useBillPageStore } from "../../useBillPageStore";

const BillSteps = [
  { key: "introduced", label: "Introduced" },
  { key: "committee", label: "Committee" },
  { key: "house", label: "House" },
  { key: "senate", label: "Senate" },
  { key: "president", label: "President" },
  { key: "law", label: "Law" },
];

const BillTimeline = () => {
  const billActions = useBillPageStore((f) => f.billData?.legislation?.actions);

  const getCurrentStep = useMemo(() => {
    if (!billActions || billActions.length === 0) return -1;

    // Check for "Became Law" - this includes being signed by president
    const becameLaw = billActions.some(
      (action) =>
        action.type === "BecameLaw" ||
        action.actionCode === "36000" ||
        action.text.toLowerCase().includes("became public law") ||
        action.text.toLowerCase().includes("signed by president")
    );
    if (becameLaw) return 5;

    // Check for "President" - only for actions sent to president but not yet signed
    const toPresident = billActions.some(
      (action) =>
        (action.type === "President" && action.actionCode === "E30000") ||
        action.text.toLowerCase().includes("presented to president")
    );
    if (toPresident) return 4;

    // Check for "Senate"
    const passedSenate = billActions.some(
      (action) =>
        action.text.toLowerCase().includes("passed senate") ||
        action.actionCode === "S37000"
    );
    if (passedSenate) return 3;

    // Check for "House"
    const passedHouse = billActions.some(
      (action) =>
        action.text.toLowerCase().includes("passed house") ||
        action.actionCode === "H37000"
    );
    if (passedHouse) return 2;

    // Check for "Committee" - reported from committee
    const committee = billActions.some(
      (action) =>
        action.type === "Committee" &&
        (action.text.toLowerCase().includes("reported") ||
          action.actionCode === "5000" ||
          action.actionCode === "H12200")
    );
    if (committee) return 1;

    // Check for "Introduced"
    const introduced = billActions.some(
      (action) =>
        action.type === "IntroReferral" ||
        action.actionCode === "1000" ||
        action.text.toLowerCase().includes("introduced")
    );
    if (introduced) return 0;

    return -1;
  }, [billActions]);

  const getStepStatus = (stepIndex) => {
    if (stepIndex <= getCurrentStep) return "completed";
    return "upcoming";
  };

  return (
    <div className=" rounded-lg p-3  shadow-sm">
      <h2 className="text-xl font-semibold mb-3">Bill Timeline</h2>

      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{
              width:
                getCurrentStep >= 0
                  ? `${((getCurrentStep + 1) / BillSteps.length) * 100}%`
                  : "0%",
            }}
          />
        </div>

        {/* Steps */}
        {BillSteps.map((step, index) => {
          const status = getStepStatus(index);

          return (
            <div key={step.key} className="relative flex flex-col items-center">
              {/* Step indicator */}
              <div
                className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center bg-background transition-all duration-200
                ${
                  status === "completed"
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30 bg-background"
                }
              `}
              >
                {status === "completed" ? (
                  <CheckCircle className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
                )}
              </div>

              {/* Step label */}
              <span
                className={`
                text-xs mt-2 text-center font-medium transition-colors duration-200
                ${
                  status === "completed"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current status */}
      <div className="mt-3 text-xs text-muted-foreground">
        <span className="font-medium">
          {getCurrentStep >= 0 ? BillSteps[getCurrentStep].label : "Unknown"}
        </span>
      </div>
    </div>
  );
};

export default BillTimeline;
