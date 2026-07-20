import type { ComponentPropsWithoutRef } from "react"
import { PolicyAreas } from "@/lib/constants/policy-areas"
import { PolicyArea } from "@prisma/client"



interface PolicyBadgeProps extends ComponentPropsWithoutRef<"label"> {
  policyArea: PolicyArea
}

const PolicyBadge = ({ policyArea, className, ...rest }: PolicyBadgeProps) => {
  const foundPolicyArea = PolicyAreas[policyArea?.name]

  return (
    <div className="flex items-center gap-2 max-w-max">
      <div style={{
        backgroundColor: foundPolicyArea?.chart_color_light
      }} className="h-4 w-4 shrink-0 rounded-sm" />
      <label className={`line-clamp-2 text-sm text-muted-foreground  ${className ?? ""}`}
        {...rest}
      >{policyArea?.name}</label>

    </div>
  )
}

export default PolicyBadge 
