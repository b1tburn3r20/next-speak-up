import { Legislation } from "@prisma/client";
import React from "react";

interface AiBillWordCountProps {
  bill: Legislation;
}
const AiBillWordCount = ({ bill }: AiBillWordCountProps) => {
  return <div>{bill.word_count}</div>;
};

export default AiBillWordCount;
