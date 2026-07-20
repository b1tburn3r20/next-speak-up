"use client"
import { Input } from "@/components/ui/input"
import FutureFeatureWrapper from "@/components/cb/future-feature-wrapper"
import PillLabel from "@/components/cb/pill-label"
import OuterBlock from "@/components/cb/outer-block"
import StackBlock from "@/components/cb/stack-block"

const DashboardSearches = () => {
  return (
    <OuterBlock className="flex items-center gap-2">
      <FutureFeatureWrapper>
        <StackBlock>
          <PillLabel variant="green">Search Bills</PillLabel>
          <Input placeholder="Search legislation..." />
        </StackBlock>
      </FutureFeatureWrapper>
      <FutureFeatureWrapper>
        <StackBlock>
          <PillLabel variant="red">Search Congress Members</PillLabel>
          <Input placeholder="Search legislators..." />
        </StackBlock>
      </FutureFeatureWrapper>
    </OuterBlock>
  )
}

export default DashboardSearches
