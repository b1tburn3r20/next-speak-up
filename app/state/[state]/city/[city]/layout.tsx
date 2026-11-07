import { notFound } from "next/navigation";
import { cityByKey, stateByKey } from "@/lib/civic/states";

type Props = { params: Promise<{ state: string; city: string }>; children: React.ReactNode };

/** A city we don't cover is a real 404, before its loading screen can answer. */
export default async function CityLayout({ params, children }: Props) {
  const { state, city } = await params;
  const config = stateByKey(state);
  if (!config || !cityByKey(config, city)) notFound();
  return children;
}
