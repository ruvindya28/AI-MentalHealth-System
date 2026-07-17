"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg font-sans",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground rounded-lg",
          cancelButton: "bg-muted text-muted-foreground rounded-lg",
          success: "!text-success-foreground data-[type=success]:[&_svg]:text-success",
          warning: "!text-warning-foreground data-[type=warning]:[&_svg]:text-warning",
          error: "!text-crisis-foreground data-[type=error]:[&_svg]:text-crisis",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
