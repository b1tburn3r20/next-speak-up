"use client";

import { useState } from "react";
import { Check, Globe, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { XP_AMOUNTS } from "@/lib/civic/progress";
import { useCivicStore, type RepReveal } from "@/stores/use-civic-store";

/** Call or write to a rep, then say you did. We take their word for it. */
export function ContactRep({ slug, rep }: { slug: string; rep: RepReveal }) {
  const [done, setDone] = useState(rep.contacted);
  const [saving, setSaving] = useState(false);
  const report = useCivicStore((state) => state.reportContact);
  if (!rep.phone && !rep.websiteUrl) return null;

  const onReport = async () => {
    setSaving(true);
    try {
      await report(slug, rep.personId);
      setDone(true);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pl-[3.75rem]" data-testid="contact-rep">
      {rep.phone ? (
        <Button asChild variant="secondary" size="sm">
          <a href={`tel:${rep.phone.replace(/[^\d+]/g, "")}`} data-testid="contact-call">
            <Phone className="size-4" aria-hidden />
            Call
          </a>
        </Button>
      ) : null}
      {rep.websiteUrl ? (
        <Button asChild variant="secondary" size="sm">
          <a href={rep.websiteUrl} target="_blank" rel="noreferrer" data-testid="contact-site">
            <Globe className="size-4" aria-hidden />
            Website
          </a>
        </Button>
      ) : null}
      {done ? (
        <span className="inline-flex items-center gap-1 text-sm font-bold text-support" data-testid="contact-done">
          <Check className="size-4" aria-hidden />
          You said you did
        </span>
      ) : (
        <Button variant="link" size="sm" className="px-1" disabled={saving} onClick={onReport} data-testid="contact-report">
          I did it (+{XP_AMOUNTS.CONTACTED_REP} XP)
        </Button>
      )}
    </div>
  );
}
