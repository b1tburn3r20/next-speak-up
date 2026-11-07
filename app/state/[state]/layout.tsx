import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stateByKey } from "@/lib/civic/states";

type Props = { params: Promise<{ state: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const state = stateByKey((await params).state);
  return state ? { title: { template: `%s · ${state.name}`, default: state.name } } : {};
}

/** Every state page goes through here, so a state we don't cover is a real 404. */
export default async function StateLayout({ params, children }: Props) {
  if (!stateByKey((await params).state)) notFound();
  return children;
}
