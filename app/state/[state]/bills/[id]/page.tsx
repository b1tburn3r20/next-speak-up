import { BillPage, billPageMetadata } from "@/components/bills/bill-page";

type Props = { params: Promise<{ state: string; id: string }> };

export const generateMetadata = billPageMetadata;

/** A state's bills only open under that state's URL. */
export default async function StateBillPage(props: Props) {
  const { state } = await props.params;
  return <BillPage {...props} prefix={`${state}-`} />;
}
