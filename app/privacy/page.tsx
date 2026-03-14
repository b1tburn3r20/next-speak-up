import PrivacyHero from "./PrivacyHero"
import PrivacyWillSell from "./PrivacyWillSell"
import SellableData from "./SellableData"


const Page = () => {
  return (
    <div className="mx-auto container">
      <PrivacyHero />
      <SellableData />
      <div className="flex gap-8 flex-wrap">
        <PrivacyWillSell />
      </div>
    </div>
  )
}

export default Page
