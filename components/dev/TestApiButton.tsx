"use client";
import { toast } from "sonner";
import { Button } from "../ui/button";

const TestApiButton = () => {
  const testApiRequest = async () => {
    const response: any = await fetch("/api/dev/test");
    const data = await response.json();
    if (data.error) {
      toast.error(data.error);
    }
  };

  return (
    <div>
      <Button onClick={testApiRequest}>Test API</Button>
    </div>
  );
};

export default TestApiButton;
