import { cn } from "@/lib/utils"
import React from "react"
interface BlockAProps {
  children: React.ReactNode
  className?: string
}
const BlockA = ({ children, className }: BlockAProps) => {
  return (
    <div className={cn("p-2 rounded-3xl shadow-md bg-background", className)}>{children}</div>
  )
}

export default BlockA 
