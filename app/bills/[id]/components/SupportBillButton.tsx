"use client";

import { AuroraText } from "@/components/magicui/aurora-text";

const SupportBillButton = () => {
  const handleSupportClick = () => {
    // something
  };

  const colors = ["#FF0080", "#7928CA", "#0070F3", "#38bdf8"];
  return (
    <button onClick={handleSupportClick}>
      <div className="flex flex-col items-center space-y-4 tracking-[0.3em] font-bold text-2xl">
        <AuroraText>beautiful</AuroraText>{" "}
      </div>

      {/* Ripple effect */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-active:opacity-20 group-active:animate-ping" />
      </div>
    </button>
  );
};

export default SupportBillButton;
