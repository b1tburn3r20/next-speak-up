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

export function policyIcon(name: string | null | undefined): LucideIcon {
  const area = policyAreaByName(name);
  return area ? FAMILY_ICON[area.family] : CircleHelp;
}

/** Color, icon, and name together, so the color is never the only signal. */
export function PolicyChip({
  name,
  link = false,
  className,
}: {
  name: string | null | undefined;
  /** Turn this off inside something that's already a link. */
  link?: boolean;
  className?: string;
}) {
  const style = policyStyle(name);
  const Icon = policyIcon(name);
  const area = policyAreaByName(name);
  const chip = (
    <span
      data-testid="policy-chip"
      title={area?.explanation}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold text-foreground",
        className,
      )}
      style={{ backgroundColor: style.tint }}
    >
      <Icon className="size-3.5 shrink-0" style={{ color: style.color }} aria-hidden />
      <span className="min-w-0 truncate">{name ?? "Not categorized yet"}</span>
    </span>
  );
  return link && area ? <Link href={`/topics/${area.slug}`}>{chip}</Link> : chip;
}
