import { cn } from "@/lib/utils";

interface MatchScoreProps {
  score: number | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function MatchScore({ score, size = "md", showLabel = false }: MatchScoreProps) {
  if (score === null || score === undefined) return null;

  const color =
    score >= 80
      ? "text-emerald-500"
      : score >= 60
      ? "text-amber-500"
      : score >= 40
      ? "text-orange-500"
      : "text-red-500";

  const bgColor =
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
      ? "bg-amber-500"
      : score >= 40
      ? "bg-orange-500"
      : "bg-red-500";

  const ringColor =
    score >= 80
      ? "ring-emerald-100 dark:ring-emerald-900/30"
      : score >= 60
      ? "ring-amber-100 dark:ring-amber-900/30"
      : score >= 40
      ? "ring-orange-100 dark:ring-orange-900/30"
      : "ring-red-100 dark:ring-red-900/30";

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "relative inline-flex items-center justify-center rounded-full ring-2",
          ringColor,
          size === "sm" && "h-8 w-8",
          size === "md" && "h-10 w-10",
          size === "lg" && "h-14 w-14"
        )}
      >
        <svg
          className={cn(
            "absolute",
            size === "sm" && "-inset-0.5",
            size === "md" && "-inset-0.5",
            size === "lg" && "-inset-1"
          )}
          viewBox="0 0 36 36"
        >
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted/30"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            strokeWidth="2"
            className={bgColor.replace("bg-", "stroke-")}
            strokeDasharray={`${(score / 100) * 100.53} 100.53`}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
        </svg>
        <span
          className={cn(
            "font-bold tabular-nums z-10",
            color,
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base"
          )}
        >
          {score}
        </span>
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">Match score</span>
      )}
    </div>
  );
}
