import { CongressionalVoteType } from "@/lib/types/bill-types";
import BillsPersonalizedLegislatorsVoteContainer from "./bills-personlized-legislators-vote-container";
import { MissingDistrictModal } from "@/app/dashboard/components/user-personalized-dashboard-representative-widget";
import LoginSignupBlock from "@/components/cb/login-signup-block";
import { STATE_NAMES } from "@/lib/constants/state-names";

interface YourRepVotesProps {
  userId?: string;
  district?: string | null
  state?: string | null
  congressionalVotes: CongressionalVoteType[]
}

const YourRepVotes = ({
  userId,
  district,
  state,
  congressionalVotes
}: YourRepVotesProps) => {



  if (!congressionalVotes?.length) {
    return null
  }

  if (!userId) {
    return <LoginSignupBlock pText="To see how your representatives vote on bills, sign up or log in, dont worry, wont take but a second." />
  }

  const hasPeople = state && district

  return (
    <div className="w-full">
      {hasPeople ? (

        <BillsPersonalizedLegislatorsVoteContainer state={state} district={district} votes={congressionalVotes[0]} />

      ) : (
        <MissingDistrictModal pText="To see how your representative voted we'll need to ask what district you're from" bText="Select district" />

      )}
    </div >
  );
};
export default YourRepVotes;
