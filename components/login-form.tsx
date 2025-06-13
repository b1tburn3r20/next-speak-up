'use client'

import React from 'react'
import { signIn } from 'next-auth/react'
import { Button } from './ui/button'
const LoginForm = () => {

  const handleSignin = async () => {
    await signIn("google")
  }
  return (
    <div><Button onClick={handleSignin}>Google</Button></div>
  )
}

export default LoginForm