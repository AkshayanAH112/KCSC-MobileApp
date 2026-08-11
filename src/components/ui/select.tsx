import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Styled native <select>. Uses the platform picker on mobile devices,
 * which is the expected UX inside a Capacitor webview.
 */
function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div data-slot="select" className="relative w-full">
      <select
        data-slot="select-trigger"
        className={cn(
          "h-11 w-full min-w-0 appearance-none rounded-lg border border-input bg-card py-1 pr-9 pl-3.5 text-base text-foreground shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&>option]:bg-popover [&>option]:text-popover-foreground",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { Select }
