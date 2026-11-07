import Link from "next/link";
import {
  BookOpen,
  CircleHelp,
  Coins,
  Globe,
  HeartPulse,
  House,
  Landmark,
  Leaf,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { policyAreaByName, policyStyle, type PolicyFamily } from "@/lib/civic/policy-areas";
import { cn } from "@/lib/utils";
import { stateRoutes, topicPath } from "@/lib/routes";
import { stateOfSlug } from "@/lib/civic/states";

const FAMILY_ICON: Record<PolicyFamily, LucideIcon> = {
  economy: Coins,
  government: Landmark,
  learning: BookOpen,
  places: House,
  health: HeartPulse,
  nature: Leaf,
  world: Globe,
  justice: Scale,
};

export function PolicyIcon({
  name,
  ...rest
}: { name: string | null | undefined } & React.ComponentProps<LucideIcon>) {
  const area = policyAreaByName(name);
  const Icon = area ? FAMILY_ICON[area.family] : CircleHelp;
  return <Icon {...rest} />;
}

/** Color, icon, and name together, so the color is never the only signal. */
export function PolicyChip({
  name,
  link = false,
  slug,
  className,
}: {
  name: string | null | undefined;
  /** The bill it's on. A state bill's topic leads to that state's bills, not Congress's. */
  slug?: string;
  /** Turn this off inside something that's already a link. */
  link?: boolean;
  className?: string;
}) {
  const style = policyStyle(name);
  // A state bill's topic leads to that state's bills, and the federal explanation doesn't apply.
  const billState = slug ? stateOfSlug(slug) : null;
  const area = policyAreaByName(name);
  const chip = (
    <span
      data-testid="policy-chip"
      title={billState ? undefined : area?.explanation}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold text-foreground",
        className,
      )}
      style={{ backgroundColor: style.tint }}
    >
      <PolicyIcon name={name} className="size-3.5 shrink-0" style={{ color: style.color }} aria-hidden />
      <span className="min-w-0 truncate">{name ?? "Not categorized yet"}</span>
    </span>
  );
  if (link && area && billState) {
    return (
      <Link href={`${stateRoutes(billState.key).bills}?policyArea=${encodeURIComponent(area.name)}`} className="tap inline-flex max-w-full">
        {chip}
      </Link>
    );
  }
  return link && area ? <Link href={topicPath(area.slug)} className="tap inline-flex max-w-full">{chip}</Link> : chip;
}
