import { cn } from "@/lib/utils"
import React from "react"
interface BlockBProps {
  children: React.ReactNode
  className?: string
}
const BlockB = ({ children, className }: BlockBProps) => {
  return (
    <div className={cn("bg-background-light p-4 rounded-3xl shadow-md", className)}> {children}</ div>
  )
}

export default BlockB 
