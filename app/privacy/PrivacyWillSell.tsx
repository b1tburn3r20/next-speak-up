import { Highlighter } from "@/components/ui/highlighter"
import { Separator } from "@/components/ui/separator"

const PrivacyWillSell = () => {
  return (
    <div>
      <h2 className="text-3xl font-semibold">What we plan
        on <span className="text-primary">selling</span>
      </h2>
      <Separator className="my-2 bg-primary h-1" />
      <Highlighter action="underline" color="#FF9800">
        <p className="text-xl">Anonymous Data</p>
      </Highlighter>
      <ul className="list-disc mt-2 ml-4 text-lg">
        <li>How many users</li>
        <li>How users vote</li>
        <li>What things people are voting on</li>
        <li>Random poll data</li>
      </ul>
      <p className="italic font-thin text-muted-foreground">None of this data will have person identifiable information attached to it, it is all just verified numbers for insights</p>
    </div>
  )
}

export default PrivacyWillSell
