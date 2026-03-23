"use client"

import { useBillPageStore } from "../useBillPageStore"
import { PolicyAreas } from "@/lib/constants/policy-areas"
const BillPolicyAreaMarker = () => {
  const billPolicyArea = useBillPageStore((f) => f.billData?.policyArea)
  const foundPolicyArea = billPolicyArea?.name && billPolicyArea?.name in PolicyAreas ? PolicyAreas[billPolicyArea?.name] : null
  return (
    <div className="flex gap-2 items-center">
      <div
        style={{ backgroundColor: foundPolicyArea?.chart_color_light ?? "#e5e7eb" }}
        className="h-4 w-4 rounded-xs"
      />      <p>{billPolicyArea?.name}</p>
    </div>
  )
}

export default BillPolicyAreaMarker
