import { dayColorConfig } from "@/lib/configs/config-one"
import { formatDateName } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentPropsWithoutRef } from "react"

const dayBadgeVariants = cva(
  "inline-flex max-w-max items-center rounded-xl border font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "",
        solid: "border-transparent text-white",
        outline: "bg-transparent",
        ghost: "border-transparent bg-transparent",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-2.5 py-1 text-sm",
        lg: "px-3 py-1.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const colorVariants = {
  yesterday: {
    default: "border-red-600 bg-red-500/10 text-red-500",
    solid: "bg-red-500 hover:bg-red-500/90",
    outline: "border-red-500 text-red-500",
    ghost: "text-red-500 hover:bg-red-500/10",
  },
  today: {
    default: "border-orange-600 bg-orange-500/10 text-orange-500",
    solid: "bg-orange-500 hover:bg-orange-500/90",
    outline: "border-orange-500 text-orange-500",
    ghost: "text-orange-500 hover:bg-orange-500/10",
  },
  tomorrow: {
    default: "border-yellow-600 bg-yellow-500/10 text-yellow-600",
    solid: "bg-yellow-500 text-yellow-950 hover:bg-yellow-500/90",
    outline: "border-yellow-500 text-yellow-600",
    ghost: "text-yellow-600 hover:bg-yellow-500/10",
  },
  monday: {
    default: "border-green-600 bg-green-500/10 text-green-500",
    solid: "bg-green-500 hover:bg-green-500/90",
    outline: "border-green-500 text-green-500",
    ghost: "text-green-500 hover:bg-green-500/10",
  },
  tuesday: {
    default: "border-blue-600 bg-blue-500/10 text-blue-500",
    solid: "bg-blue-500 hover:bg-blue-500/90",
    outline: "border-blue-500 text-blue-500",
    ghost: "text-blue-500 hover:bg-blue-500/10",
  },
  wednesday: {
    default: "border-purple-600 bg-purple-500/10 text-purple-500",
    solid: "bg-purple-500 hover:bg-purple-500/90",
    outline: "border-purple-500 text-purple-500",
    ghost: "text-purple-500 hover:bg-purple-500/10",
  },
  thursday: {
    default: "border-indigo-600 bg-indigo-500/10 text-indigo-500",
    solid: "bg-indigo-500 hover:bg-indigo-500/90",
    outline: "border-indigo-500 text-indigo-500",
    ghost: "text-indigo-500 hover:bg-indigo-500/10",
  },
  friday: {
    default: "border-violet-600 bg-violet-500/10 text-violet-500",
    solid: "bg-violet-500 hover:bg-violet-500/90",
    outline: "border-violet-500 text-violet-500",
    ghost: "text-violet-500 hover:bg-violet-500/10",
  },
  saturday: {
    default: "border-fuchsia-600 bg-fuchsia-500/10 text-fuchsia-500",
    solid: "bg-fuchsia-500 hover:bg-fuchsia-500/90",
    outline: "border-fuchsia-500 text-fuchsia-500",
    ghost: "text-fuchsia-500 hover:bg-fuchsia-500/10",
  },
  sunday: {
    default: "border-pink-600 bg-pink-500/10 text-pink-500",
    solid: "bg-pink-500 hover:bg-pink-500/90",
    outline: "border-pink-500 text-pink-500",
    ghost: "text-pink-500 hover:bg-pink-500/10",
  },
  gray: {
    default: "border-gray-600 bg-gray-500/10 text-gray-500",
    solid: "bg-gray-500 hover:bg-gray-500/90",
    outline: "border-gray-500 text-gray-500",
    ghost: "text-gray-500 hover:bg-gray-500/10",
  },
} as const

type DayColor = keyof typeof colorVariants
type DayBadgeVariant = NonNullable<
  VariantProps<typeof dayBadgeVariants>["variant"]
>

interface DayBadgeProps
  extends ComponentPropsWithoutRef<"label">,
  VariantProps<typeof dayBadgeVariants> {
  time: Date
}

const DayBadge = ({
  time,
  variant = "default",
  size = "default",
  className,
  ...props
}: DayBadgeProps) => {
  const formattedDateName = formatDateName(time)
  const configuredColor = formattedDateName?.toLocaleLowerCase()
  const color: DayColor =
    configuredColor && configuredColor in colorVariants
      ? (configuredColor as DayColor)
      : "sunday"

  return (
    <label
      className={cn(
        dayBadgeVariants({ variant, size }),
        colorVariants[color][variant as DayBadgeVariant],
        className
      )}
      {...props}
    >
      {formattedDateName}
    </label>
  )
}

export default DayBadge
