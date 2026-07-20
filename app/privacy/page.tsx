import OuterBlock from "@/components/cb/outer-block"
import PrivacyHero from "./PrivacyHero"
// import PrivacyWillSell from "./PrivacyWillSell"
// import SellableData from "./SellableData"
import StackBlock from "@/components/cb/stack-block"


const Page = () => {
  return (
    <StackBlock className="mx-auto container">
      <OuterBlock>
        <PrivacyHero />
      </OuterBlock>
      {/* <OuterBlock> */}
      {/*   <SellableData /> */}
      {/* </OuterBlock> */}
      {/* <OuterBlock className="flex gap-8 flex-wrap"> */}
      {/*   <PrivacyWillSell /> */}
      {/* </OuterBlock> */}
    </StackBlock >
  )
}

export default Page
