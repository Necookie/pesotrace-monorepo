import { cn } from "@/lib/utils"

// Fill is surface-strong, not shadcn's default bg-muted: in this theme
// --color-muted (#7c828a) is the *text* muted token and renders as a solid
// dark block. surface-strong is the neutral fill used for inert surfaces.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-surface-strong", className)}
      {...props}
    />
  )
}

export { Skeleton }
