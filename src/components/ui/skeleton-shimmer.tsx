import { cn } from "@/lib/utils";

interface SkeletonShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "text" | "avatar" | "button";
}

export function SkeletonShimmer({
  className,
  variant = "default",
  ...props
}: SkeletonShimmerProps) {
  const variantStyles = {
    default: "h-4 w-full",
    card: "h-32 w-full",
    text: "h-4 w-3/4",
    avatar: "h-12 w-12 rounded-full",
    button: "h-10 w-24",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent",
        "before:animate-[shimmer_2s_infinite]",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <SkeletonShimmer className="h-8 w-48" />
          <SkeletonShimmer className="h-4 w-64" />
        </div>
        <SkeletonShimmer className="h-16 w-40" />
      </div>

      {/* Mascot */}
      <SkeletonShimmer className="h-24 w-full rounded-xl" />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <SkeletonShimmer key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <SkeletonShimmer className="h-6 w-32" />
            <SkeletonShimmer className="h-8 w-20" />
          </div>
          {[1, 2, 3].map((i) => (
            <SkeletonShimmer key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="space-y-4">
          <SkeletonShimmer className="h-48 rounded-xl" />
          <SkeletonShimmer className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// Course list skeleton
export function CoursesSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-4">
            <SkeletonShimmer className="h-48 rounded-xl" />
            <SkeletonShimmer className="h-6 w-3/4" />
            <SkeletonShimmer className="h-4 w-full" />
            <SkeletonShimmer className="h-2 w-full" />
            <SkeletonShimmer className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Community skeleton
export function CommunitySkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Groups list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 border rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonShimmer variant="avatar" />
              <div className="flex-1 space-y-2">
                <SkeletonShimmer className="h-5 w-3/4" />
                <SkeletonShimmer className="h-3 w-1/2" />
              </div>
            </div>
            <SkeletonShimmer className="h-4 w-full" />
            <SkeletonShimmer className="h-8 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Chat messages skeleton
export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-fade-in">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={cn("flex gap-3", i % 2 === 0 ? "justify-end" : "")}>
          {i % 2 !== 0 && <SkeletonShimmer variant="avatar" />}
          <div className={cn("space-y-2", i % 2 === 0 ? "items-end" : "")}>
            <SkeletonShimmer className={cn("h-16 rounded-2xl", i % 2 === 0 ? "w-48" : "w-64")} />
            <SkeletonShimmer className="h-3 w-16" />
          </div>
          {i % 2 === 0 && <SkeletonShimmer variant="avatar" />}
        </div>
      ))}
    </div>
  );
}
