import BillsCarousel from "@/components/cb/bills-carousel"
import FutureFeatureWrapper from "@/components/cb/future-feature-wrapper"
import OuterBlock from "@/components/cb/outer-block"
import { TextAnimate } from "@/components/magicui/text-animate"
import { getNewBills } from "@/lib/services/bills"
const DashboardVotingThisWeek = async () => {
  try {
    const response = await getNewBills()
    const bills = Array.isArray(response) ? response : []
    return (
      (
        <FutureFeatureWrapper>
          <OuterBlock>
            <TextAnimate
              animation="blurInUp"
              by="word"
              className="text-2xl mb-4 sm:mb-6 font-bold [&>span:last-child]:text-primary px-2 sm:px-0"
            >
              Voting this week
            </TextAnimate>

            <BillsCarousel bills={bills ?? []} />
          </OuterBlock>
        </FutureFeatureWrapper>
      )
    )
  } catch (error) {
    console.error("API ERROR: Failed to fetch")
    return (
      <FutureFeatureWrapper>
        <OuterBlock>
          <BillsCarousel bills={[]} />
        </OuterBlock>
      </FutureFeatureWrapper>

    )
  }
}

export default DashboardVotingThisWeek
