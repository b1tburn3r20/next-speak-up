import { SparklesText } from "@/components/ui/sparkles-text"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import NumberTicker from "@/components/ui/number-ticker"

const ActivityPointsWidget = () => {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        Activity Points
      </CardHeader>
      <CardContent className="flex flex-col gap-2 justify-center items-center flex-1 w-full">
        <SparklesText sparklesCount={5} className="m-2">
          <NumberTicker className="text-8xl" value={18802} />
        </SparklesText>
        <p className="text-xl">Top 3% Globally</p>
      </CardContent>
    </Card>
  )
}

export default ActivityPointsWidget
