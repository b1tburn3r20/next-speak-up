"use client"
import BlockA from "@/components/cb/block-a"
import BlockB from "@/components/cb/block-b"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Eye, } from "lucide-react"
import { useBillPageStore } from "../../useBillPageStore"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState } from "react"

interface CongressMemberVoteRowProps {
  congressMember: any
}




const CongressMemberVoteRow = ({ congressMember }: CongressMemberVoteRowProps) => {
  const userVote = useBillPageStore((f) => f.billData?.userVote)
  const [open, setOpen] = useState<boolean>(false)
  const [hidden, setHidden] = useState<boolean>(!userVote)

  useEffect(() => {
    // its weird that its not working on state initialization, but this useEffect will ensure it like a warden ensures prisoners stay in their cells.
    // not accounting for breakouts lol
    if (userVote) {
      setHidden(false)
    } else {
      setHidden(true)
    }
  }, [userVote])



  const getVoteText = () => {
    switch (congressMember?.votePosition) {
      case "NOT_VOTING":
        return (
          <p>
            {congressMember?.member?.firstName} {congressMember?.member?.lastName} <span className={hidden ? "" : "bg-red-500"}>avoided voting </span> on this legislation on behalf of the entire state of {congressMember?.member?.state}
          </p>
        )

      case "YEA":
        return (
          <p>
            {congressMember?.member?.firstName} {congressMember?.member?.lastName} voted to <span className={hidden ? "" : "bg-green-500"}>PASS</span> this legislation on behalf of the entire state of {congressMember?.member?.state}
          </p>
        )
      case "NAY":
        return (
          <p>
            {congressMember?.member?.firstName} {congressMember?.member?.lastName} voted <span className={hidden ? "" : "bg-red-500"}>AGAINST</span> this legislation on behalf of the entire state of {congressMember?.member?.state}
          </p>
        )
      case "PRESENT":
        return (
          <p>
            {congressMember?.member?.firstName} {congressMember?.member?.lastName} <span className={hidden ? "" : "bg-red-500"}>avoided voting </span> on this legislation on behalf of the entire state of {congressMember?.member?.state}
          </p>
        )

      default:
        return "unknown";
    }
  }

  const handleRevealClick = () => {
    if (userVote) {
      setHidden(false)
    } else {
      setOpen(true)
    }
  }

  return (
    <div key={congressMember?.member?.bioguideId} className="relative">
      <BlockA className="flex gap-2 items-center">
        <Avatar className="w-20 h-20 md:h-16 md:w-16">
          {congressMember.member.depiction ? (
            <AvatarImage src={congressMember.member.depiction.imageUrl} alt={congressMember.name} />
          ) : null}
          <AvatarFallback>
            {congressMember.member.firstName[0]}
            {congressMember.member.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <BlockB className="relative w-full">
          {hidden ? (
            <BlockA className="w-full h-full top-0 left-0 absolute z-10 " >
              <div
                className="flex justify-between gap-2 w-full items-center text-lg"
                onClick={() => handleRevealClick()}
              >
                <p className="flex gap-1 items-center">Vote to reveal how<span className="text-primary">your</span> representative voted on this legislation</p>
                <Button size="icon">

                  <Eye />
                </Button>
              </div>
            </BlockA>
          ) : (
            ""
          )}


          <div className="italic text-sm  md:text-lg">
            {getVoteText()}
          </div>
        </BlockB>

      </BlockA>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              We really recommend you vote first..
            </DialogTitle>
            <DialogDescription>
              Here are CoolBills we believe that your opinion matters most, so ideally you wouldnt be influenced by how your representative or senators voted before you make your decision, all the power is in your hands, however if you're sure, you can skip this and just reveal anyways, no harm no foul.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 items-center">
            <DialogClose asChild>
              <Button variant="secondary">I'll vote first</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button onClick={() => setHidden(false)} variant="destructive">
                Show me anyways
              </Button>
            </DialogClose>
          </div>        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CongressMemberVoteRow  
