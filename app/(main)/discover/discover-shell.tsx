"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export function DiscoverShell({
  search,
  filters,
  results,
}: {
  search: ReactNode;
  filters: ReactNode;
  results: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 63.999rem)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <form
      method="get"
      className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]"
    >
      <div className="flex items-center gap-3 lg:col-span-2">
        <div className="relative flex-1">{search}</div>
        <Button
          type="submit"
          variant="outline"
          pill
          className="shrink-0"
          aria-expanded={isMobile ? open : undefined}
          aria-controls={isMobile ? "discover-filters" : undefined}
          onClick={
            isMobile
              ? (e) => {
                  e.preventDefault();
                  setOpen((v) => !v);
                }
              : undefined
          }
        >
          <SlidersHorizontal className="size-4" />
          Filter
        </Button>
      </div>

      <aside
        id="discover-filters"
        className={cn(
          "space-y-7 lg:sticky lg:top-20 lg:self-start",
          open ? "block" : "hidden lg:block",
        )}
      >
        {filters}
      </aside>

      <section>{results}</section>
    </form>
  );
}
