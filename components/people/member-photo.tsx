import Image from "next/image";
import { cn } from "@/lib/utils";

const PARTY_RING: Record<string, string> = {
  D: "ring-party-d",
  R: "ring-party-r",
  I: "ring-party-i",
};

const PARTY_FILL: Record<string, string> = {
  D: "bg-party-d",
  R: "bg-party-r",
  I: "bg-party-i",
};

function initials(name: string): string {
  const words = name.replace(/[^\p{L} ]/gu, "").split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "?";
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

/** Every person gets a face. With no photo, it's their initials. The ring shows their party. */
export function MemberPhoto({
  name,
  url,
  party,
  size = 48,
  className,
}: {
  name: string;
  url: string | null | undefined;
  party?: string | null;
  size?: number;
  className?: string;
}) {
  const ring = cn(
    "shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-card",
    (party && PARTY_RING[party]) ?? "ring-border",
    className,
  );
  if (!url) {
    return (
      <div
        aria-hidden
        style={{ width: size, height: size, fontSize: size * 0.36 }}
        className={cn(
          "flex items-center justify-center font-extrabold text-primary-foreground",
          (party && PARTY_FILL[party]) ?? "bg-muted-foreground",
          ring,
        )}
        data-testid="member-initials"
      >
        {initials(name)}
      </div>
    );
  }
  return (
    <Image
      src={url}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("object-cover object-top", ring)}
    />
  );
}
