"use client";
import ReactMarkdown from "react-markdown";
import { useMemo } from "react";
import { useBillPageStore } from "../useBillPageStore";
import { processTextForTTS, TTS_HIGHLIGHT_CLASSES } from "./helpers/ttsUtils";
interface BillSummaryProps {
  text: string;
}

export default function BillSummary({ text }: BillSummaryProps) {
  // Subscribe to TTS state from Zustand store
  const ttsIsPlaying = useBillPageStore((state) => state.ttsIsPlaying);
  const ttsWordTimestamps = useBillPageStore(
    (state) => state.ttsWordTimestamps
  );
  const ttsCurrentWordIndex = useBillPageStore(
    (state) => state.ttsCurrentWordIndex
  );

  const processedContent = useMemo(() => {
    return processTextForTTS(
      text,
      ttsWordTimestamps,
      ttsCurrentWordIndex,
      ttsIsPlaying
    );
  }, [text, ttsWordTimestamps, ttsCurrentWordIndex, ttsIsPlaying]);

  return (
    <article className={TTS_HIGHLIGHT_CLASSES.container}>
      {processedContent.type === "markdown" ? (
        <ReactMarkdown>{processedContent.content}</ReactMarkdown>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: processedContent.content }} />
      )}
    </article>
  );
}
