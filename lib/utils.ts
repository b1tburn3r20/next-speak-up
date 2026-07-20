import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDateName = (date: Date) => {
  const today = new Date()
  const target = new Date(date)
  const differenceInDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (differenceInDays === -1) return "Yesterday"
  if (differenceInDays === 0) return "Today"
  if (differenceInDays === 1) return "Tomorrow"
  return Intl.DateTimeFormat("en-US", {
    weekday: "long"
  }).format(date)

}

