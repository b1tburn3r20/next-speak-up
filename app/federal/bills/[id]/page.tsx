import { BillPage, billPageMetadata, type BillPageProps } from "@/components/bills/bill-page";

export const generateMetadata = billPageMetadata;

export default function FederalBillPage(props: BillPageProps) {
  return <BillPage {...props} prefix="us-" />;
}
