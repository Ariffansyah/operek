import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({
  rating,
  size = "size-4",
}: {
  rating: number;
  size?: string;
}) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Rating ${rating} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            size,
            i <= Math.round(rating)
              ? "fill-accent-500 text-accent-500"
              : "text-gray-300",
          )}
        />
      ))}
    </span>
  );
}
