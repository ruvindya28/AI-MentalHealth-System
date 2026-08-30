"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system", resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={(resolvedTheme || theme) as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-2xl border font-sans text-sm shadow-xl transition-all duration-200",
          title: "font-semibold tracking-tight",
          description: "opacity-90 font-normal",
          actionButton: "bg-primary text-primary-foreground rounded-xl font-medium",
          cancelButton: "bg-muted text-muted-foreground rounded-xl font-medium",
          closeButton: "border border-border/40 hover:opacity-100 transition-opacity",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
