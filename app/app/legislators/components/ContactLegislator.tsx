import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ComprehensiveLegislatorData } from "@/lib/types/legislator-types";
import { Send } from "lucide-react";

interface ContactLegislator {
  legislator: ComprehensiveLegislatorData;
}
const ContactLegislator = ({ legislator }: ContactLegislator) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Send /> Message
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Contact {legislator.firstName} {legislator.lastName}
          </DialogTitle>
          <DialogDescription>
            Filling out this forum will send an email to {legislator.role}{" "}
            {legislator.firstName} {legislator.lastName} that they will see and
            respond to.
          </DialogDescription>
        </DialogHeader>
        <p>The form will go here</p>
      </DialogContent>
    </Dialog>
  );
};

export default ContactLegislator;
