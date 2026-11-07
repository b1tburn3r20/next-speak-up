import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { BillCard } from "@/components/bills/bill-card";
import type { BillListItem } from "@/lib/civic/bills";
import { getUserBillStates } from "@/lib/civic/users";

/** A list of bills, each marked with whether you've voted, so it reads as a map of what's left. */
export async function BillCards({ bills }: { bills: BillListItem[] }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const states = userId ? await getUserBillStates(userId, bills.map((bill) => bill.id)) : null;
  return (
    <>
      {bills.map((bill) => (
        <BillCard key={bill.id} bill={bill} myPosition={states ? (states.get(bill.id)?.position ?? null) : undefined} />
      ))}
    </>
  );
}
