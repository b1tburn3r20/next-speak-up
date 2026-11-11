"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, EllipsisVertical, PlusSquare, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useInstallStore } from "@/stores/use-install-store";

// Long enough that the page is there first, so it doesn't greet someone before they've seen anything.
const ASK_AFTER_MS = 4000;

/** How to add it by hand, for an iPhone, or a browser that won't offer its own dialog again yet. */
export function InstallSteps() {
  const way = useInstallStore((state) => state.way);
  const open = useInstallStore((state) => state.showingSteps);
  const setOpen = useInstallStore((state) => state.setShowingSteps);
  const ios = way === "ios";
  const steps = ios
    ? [
        { icon: Share, text: "Tap Share, at the bottom of Safari (the square with an arrow)." },
        { icon: PlusSquare, text: "Scroll down, and tap Add to Home Screen." },
        { icon: Download, text: "Tap Add. Coolbills is on your home screen, and opens like an app." },
      ]
    : [
        { icon: EllipsisVertical, text: "Open your browser's menu, usually ⋮ at the top." },
        { icon: Download, text: "Tap Install app, or Add to Home screen." },
      ];
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent data-testid="install-steps">
        <DialogHeader className="text-left">
          <DialogTitle>Add Coolbills to your home screen</DialogTitle>
          <DialogDescription>
            {ios ? "It opens like an app, and on an iPhone it's the only way reminders can reach you." : "It opens like an app, without the browser around it."}
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3">
          {steps.map(({ icon: Icon, text }, index) => (
            <li key={text} className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-tint font-extrabold text-primary">{index + 1}</span>
              <span className="flex min-w-0 items-start gap-2 pt-1">
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>{text}</span>
              </span>
            </li>
          ))}
        </ol>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Asks once, on a phone, whether to add Coolbills to the home screen. "Not now" is remembered on this
 * device, and the More sheet keeps an Install tile. Phones only, by CSS, so the server's HTML is the
 * same for everyone.
 */
export function InstallPrompt({ hidden = false }: { hidden?: boolean }) {
  const start = useInstallStore((state) => state.start);
  const way = useInstallStore((state) => state.way);
  const asked = useInstallStore((state) => state.asked);
  const markAsked = useInstallStore((state) => state.markAsked);
  const install = useInstallStore((state) => state.install);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    start();
    const timer = setTimeout(() => setReady(true), ASK_AFTER_MS);
    return () => clearTimeout(timer);
  }, [start]);

  // Only where installing really works: the browser's own dialog, or an iPhone's Add to Home Screen.
  const offer = ready && !asked && !hidden && (way === "dialog" || way === "ios");
  return (
    <>
      {offer ? (
        <div
          role="dialog"
          aria-labelledby="install-title"
          className="animate-rise-in fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 rounded-3xl border-2 border-b-8 bg-card p-4 shadow-xl md:hidden"
          data-testid="install-prompt"
        >
          <div className="flex items-start gap-3">
            <Image src="/icons/icon-192.png" alt="" width={48} height={48} className="size-12 shrink-0 rounded-2xl" />
            <div className="min-w-0">
              <p id="install-title" className="font-extrabold leading-snug">
                Get Coolbills on your home screen
              </p>
              <p className="text-sm text-muted-foreground">
                {way === "ios" ? "It opens like an app, and it's how reminders reach an iPhone." : "It opens like an app, one tap from your home screen."}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={markAsked} data-testid="install-later">
              Not now
            </Button>
            <Button
              onClick={() => {
                markAsked();
                install();
              }}
              data-testid="install-now"
            >
              <Download className="size-4" aria-hidden />
              {way === "ios" ? "Show me how" : "Install"}
            </Button>
          </div>
        </div>
      ) : null}
      <InstallSteps />
    </>
  );
}

/** The More sheet's way to install, for whenever someone said "Not now" or wants it later. */
export function InstallTile({ onDone }: { onDone?: () => void }) {
  const start = useInstallStore((state) => state.start);
  const way = useInstallStore((state) => state.way);
  const install = useInstallStore((state) => state.install);
  useEffect(() => {
    start();
  }, [start]);
  if (way === "unknown" || way === "installed") return null;
  return (
    <section data-testid="install-tile-section">
      <h3 className="pb-1.5 text-[0.7rem] font-extrabold uppercase tracking-wide text-muted-foreground">The app</h3>
      <Button
        variant="secondary"
        className={cn("h-auto w-full justify-start gap-3 rounded-2xl p-3 text-left")}
        onClick={() => {
          onDone?.();
          install();
        }}
        data-testid="install-tile"
      >
        <Download className="size-5 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0">
          <span className="block font-extrabold text-foreground">Install Coolbills</span>
          <span className="block text-xs font-semibold">Add it to your home screen, to open it like an app</span>
        </span>
      </Button>
    </section>
  );
}
