import type { ReactNode } from "react";

export default function Marquee({ items }: { items: ReactNode[] }) {
  return (
    <div className="relative flex w-full overflow-x-hidden border-b-4 border-t-4 border-border bg-secondary-background text-foreground font-base">
      <div className="flex animate-marquee whitespace-nowrap py-3 lg:py-6 items-center">
        {items.map((item, idx) => (
          <span key={idx} className="mx-4 lg:text-2xl">
            {item}
          </span>
        ))}
      </div>

      <div className="absolute top-0 left-0 flex animate-marquee2 whitespace-nowrap py-3 lg:py-6 items-center">
        {items.map((item, idx) => (
          <span key={`marquee2-${idx}`} className="mx-4 lg:text-2xl">
            {item}
          </span>
        ))}
      </div>
      {/* must have both of these in order to work */}
    </div>
  );
}
