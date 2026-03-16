"use client"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import LoginForm from "@/components/login-form";
import { useLoginStore } from "@/app/navbar/useLoginStore";
import { useState } from "react";


const NoUserDashboard = () => {
  const isLoginDialogOpen = useLoginStore((f) => f.isLoginDialogOpen);
  const setIsLoginDialogOpen = useLoginStore((f) => f.setIsLoginDialogOpen)
  const [mode, setMode] = useState<string>("Login")


  const handleActionClick = (str: string) => {
    setMode(str)
    setIsLoginDialogOpen(true)
  }


  return (
    <div className="bg-accent text-primary border-2 text-center border-primary border-dashed p-4 rounded-3xl">
      <p className="text-sm md:text-md">Hey, no pressure but without an account we can't give you a personalized dashboard. If its not important to you no worries, but if you want one you click below </p>
      <div className="flex gap-2 items-center font-normal text-center w-full  justify-center">
        <p className="text-sm md:text-md underline cursor-pointer" onClick={() => handleActionClick("Login")}>
          Login
        </p>
        or
        <p className="underline text-sm md:text-md cursor-pointer" onClick={() => handleActionClick("Sign up")}>
          Sign up
        </p>
      </div>
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode} with Google</DialogTitle>
          </DialogHeader>
          <LoginForm mode={mode} />
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default NoUserDashboard
