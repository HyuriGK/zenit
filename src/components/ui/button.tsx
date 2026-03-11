import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-minecraft font-black tracking-widest transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 uppercase",
  {
    variants: {
      variant: {
        default: "bg-zinc-100 text-zinc-950 hover:bg-white shadow-[2px_2px_0_rgba(0,0,0,0.3)] active:translate-y-[1px] active:shadow-none",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-[2px_2px_0_rgba(0,0,0,0.3)] active:translate-y-[1px] active:shadow-none",
        outline:
          "border-2 border-zinc-800 bg-transparent hover:bg-zinc-900 hover:text-white active:translate-y-[1px]",
        secondary:
          "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 shadow-[2px_2px_0_rgba(0,0,0,0.3)] active:translate-y-[1px] active:shadow-none",
        ghost:
          "hover:bg-zinc-900 hover:text-zinc-100",
        link: "text-zinc-100 underline-offset-4 hover:underline",
        premium: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-[3px_3px_0_rgba(0,0,0,0.3)] active:translate-y-[1px] active:shadow-none",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
