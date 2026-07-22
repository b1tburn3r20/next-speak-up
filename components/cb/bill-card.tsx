import { DashboardNewBill } from "@/lib/types/bill-types"
import InnerBlock from "./inner-block"
import PolicyBadge from "./policy-badge"
import { Separator } from "@/components/ui/separator"
import SideBlock from "./side-block"
import DayBadge from "./day-badge"
const BillCard = ({ bill }: { bill: DashboardNewBill }) => {
  return (
    <InnerBlock className="w-70 hover:bg-secondary/50 h-full">
      <SideBlock className="justify-between">
        <PolicyBadge policyArea={bill?.policyArea} />
        <DayBadge time={new Date()} />
      </SideBlock>
      <Separator className="my-2" />
      <p className="line-clamp-2 max-w-max text-sm text-muted-foreground">
        {bill.title}
      </p>
    </InnerBlock>
  )
}

export default BillCard
