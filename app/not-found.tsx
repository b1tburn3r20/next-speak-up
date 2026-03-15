"use client"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React from "react";

const Page = () => {
  const router = useRouter()

  return (
    <div className="min-h-screen w-full flex justify-center items-center flex-col gap-8">
      <p>Hey! looks like you might be lost</p>
      <Button onClick={() => router.back()}> Take me to safety!</Button>
    </div>
  );
};

export default Page;
