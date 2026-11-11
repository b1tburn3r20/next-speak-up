import { notFound } from "next/navigation";
import { getCityContext } from "@/lib/civic/city-registry";
import { stateByKey } from "@/lib/civic/states";

type Props = { params: Promise<{ state: string; city: string }>; children: React.ReactNode };

/** A city that isn't in the state, as the Census lists it, is a real 404, before its loading screen can answer. */
export default async function CityLayout({ params, children }: Props) {
  const { state, city } = await params;
  const config = stateByKey(state);
  if (!config || !(await getCityContext(config, city))) notFound();
  return children;
}
