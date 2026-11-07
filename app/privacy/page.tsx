import OuterBlock from "@/components/cb/outer-block"
import PrivacyHero from "./privacy-hero"
// import PrivacyWillSell from "./privacy-will-sell"
// import SellableData from "./sellable-data"
import { PageSpacer } from "@/components/blocks"


const Page = () => {
  return (
    <PageSpacer>
      <OuterBlock>
        <PrivacyHero />
      </OuterBlock>
      {/* <OuterBlock> */}
      {/*   <SellableData /> */}
      {/* </OuterBlock> */}
      {/* <OuterBlock className="flex gap-8 flex-wrap"> */}
      {/*   <PrivacyWillSell /> */}
      {/* </OuterBlock> */}
    </PageSpacer>
  )
}

export default Page
