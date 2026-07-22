"use client"

import { Input } from "@/components/ui/input"
import FutureFeatureWrapper from "@/components/cb/future-feature-wrapper"
import PillLabel from "@/components/cb/pill-label"
import OuterBlock from "@/components/cb/outer-block"
import StackBlock from "@/components/cb/stack-block"

const DashboardSearches = () => {
  return (
    <OuterBlock className="flex flex-1 items-stretch gap-2 min-h-0 w-full">
      <FutureFeatureWrapper>
        <StackBlock className="h-full flex-1 w-full">
          <PillLabel variant="purple">Search Bills</PillLabel>
          <Input className="h-14! rounded-xl" placeholder="Search legislation..." />
        </StackBlock>
      </FutureFeatureWrapper>

      <FutureFeatureWrapper>
        <StackBlock className="h-full flex-1">
          <PillLabel variant="purple">Search Congress Members</PillLabel>
          <Input className="h-14! rounded-xl" placeholder="Search congress members..." />
        </StackBlock>
      </FutureFeatureWrapper>
    </OuterBlock>
  )
}

export default DashboardSearches
