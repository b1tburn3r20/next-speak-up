import { RollCallPage, rollCallMetadata, type RollCallPageProps } from "@/components/bills/roll-call-page";

export const metadata = rollCallMetadata;

export default function StateRollCallPage(props: RollCallPageProps) {
  return <RollCallPage {...props} />;
}
