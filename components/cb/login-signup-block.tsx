
"use client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import LoginForm from "@/components/login-form";
import { useState } from "react";


interface LoginSignupBlockProps {
  pText?: string
}

const LoginSignupBlock = ({ pText }: LoginSignupBlockProps) => {
  const [open, setOpen] = useState<boolean>(false)
  const [mode, setMode] = useState<string>("Login")


  const handleActionClick = (str: string) => {
    setMode(str)
    setOpen(true)
  }


  return (
    <div className="bg-accent text-primary border-2 text-center border-primary border-dashed p-4 rounded-3xl">
      <p className="text-sm md:text-md">{pText ? pText : "Looks like you'll need to be signed in to do that, we simply cant complete that action without it. But no worries, signing up is fast."} </p>
      <div className="flex gap-2 items-center font-normal text-center w-full  justify-center">
        <p className="text-sm md:text-md underline cursor-pointer" onClick={() => handleActionClick("Login")}>
          Login
        </p>
        <p className="text-sm">

          or
        </p>
        <p className="underline text-sm md:text-md cursor-pointer" onClick={() => handleActionClick("Sign up")}>
          Sign up
        </p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
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

export default LoginSignupBlock
