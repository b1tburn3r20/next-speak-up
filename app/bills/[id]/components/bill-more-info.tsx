import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CongressMemberWithDepiction, FullUserLegislationData } from "@/lib/types/bill-types"
import { ExternalLink, User } from "lucide-react"
import Link from "next/link"


interface BillMoreInfoProps {
  bill: FullUserLegislationData
}
const BillMoreInfo = ({ bill }: BillMoreInfoProps) => {

  const MemberCard = ({ member }: { member: CongressMemberWithDepiction }) => {
    return (
      <div className="flex py-2 gap-2 items-center">
        <Avatar className="w-16 h-16">
          {member.depiction ? (
            <AvatarImage src={member.depiction.imageUrl} alt={member.name} />
          ) : null}
          <AvatarFallback>
            {member.firstName[0]}
            {member.lastName[0]}
          </AvatarFallback>
        </Avatar>


        <div className="flex flex-col">
          <p>{member.firstName} {member.lastName}</p>
          <p className="text-muted-foreground">{member.state} {member?.district}, {member.role} </p>
          <Link className="text-muted-foreground underline" href={`/legislators/federal/${member.bioguideId}`} target="_blank">View <ExternalLink className="inline-flex" size={15} /> </Link>
        </div>
      </div>
    )
  }


  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="cursor-pointer bg-muted/50 w-fit p-4 flex justify-center items-center h-full rounded-xl border-none outline-none">
          <User className="text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sponsors &amp; Cosponsors</DialogTitle>
          <DialogDescription>
            Sponsors are the members of Congress who start a bill. Cosponsors are members who support it by putting their names on it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label>Sponsor</Label>
          <MemberCard member={bill?.sponsors[0]} />
        </div>
        <div>
          <div>Cosponsors:</div>
          <ScrollArea className="flex flex-col gap-2 max-h-100">
            {bill?.cosponsors?.length ? (
              <>

                {bill?.cosponsors?.map((cosponsor) => <MemberCard key={cosponsor.id} member={cosponsor} />)}
              </>

            ) : (
              <div className="p-4 rounded-xl bg-background-light mt-2 flex justify-center items-center text-center">
                There are no cosponsors of {bill.legislation.name_id}

              </div>
            )}
          </ScrollArea>
        </div>

      </DialogContent>
    </Dialog>
  )
}

export default BillMoreInfo
