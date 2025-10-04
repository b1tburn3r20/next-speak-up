import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

const Page = () => {
  return (
    <div className="min-h-screen w-full flex justify-center items-center flex-col gap-8">
      <p>Hey! looks like you might be lost</p>
      <Link href={"/"}>
        <Button> Take me to safety!</Button>
      </Link>
    </div>
  );
};

export default Page;
