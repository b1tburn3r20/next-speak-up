"use client";
import ReactMarkdown from "react-markdown";

interface BillSummaryProps {
  text: string;
}

export default function BillSummary({ text }: BillSummaryProps) {
  return (
    <article className="prose prose-sm sm:prose-base lg:prose-lg prose-slate dark:prose-invert max-w-none prose-a:text-blue-600 hover:prose-a:underline prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-1 prose-code:rounded-md">
      <ReactMarkdown>{text}</ReactMarkdown>
    </article>
  );
}
