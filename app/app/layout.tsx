import React from "react";
import Navbar from "./navbar/navbar";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <Navbar>{children}</Navbar>
    </div>
  );
};

export default layout;
