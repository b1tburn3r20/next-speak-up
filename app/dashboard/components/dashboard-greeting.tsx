import OuterBlock from "@/components/cb/outer-block"
import { TextAnimate } from "@/components/magicui/text-animate"
import { Session } from "next-auth"

const DashboardGreeting = ({ session }: { session: Session }) => {
  return (
    <OuterBlock className="w-fit p-4">
      <TextAnimate className="text-4xl font-bold [&>span:first-child]:text-primary">
        {session?.user?.id ? `Hello, ${session.user.name}` : "You're helping everyone."}
      </TextAnimate>
      <TextAnimate className="text-lg text-muted-foreground">
        Each and every one of us learning more helps us all.
      </TextAnimate>
    </OuterBlock>

  )
}

export default DashboardGreeting 
