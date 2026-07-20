
import OuterBlock from "@/components/cb/outer-block"
import InnerBlock from "@/components/cb/inner-block"
import { Label } from "@/components/ui/label"
import NumberTicker from "@/components/ui/number-ticker"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import FutureFeatureWrapper from "@/components/cb/future-feature-wrapper"

const CongressMemberPromiseKeptRatio = () => {
  return (
    <FutureFeatureWrapper>

      <OuterBlock className="flex flex-1">
        <InnerBlock className="flex flex-col flex-1">
          <div className="flex items-center">
            <Label>Promise Kept %</Label>
            <Link target="_blank" href="https://www.cinenetworth.com/zach-nunn-net-worth/">
              <Button className="p-0 m-0 h-3 underline" variant="link">
                <span>
                  Source
                </span>
                <ExternalLink />
              </Button>
            </Link>

          </div>
          <div className="flex items-center">
            <span className="text-muted-foreground">~%</span>
            <NumberTicker value={13} />
          </div>
        </InnerBlock>
      </OuterBlock>
    </FutureFeatureWrapper>
  )
}

export default CongressMemberPromiseKeptRatio
