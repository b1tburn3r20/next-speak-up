// utils/ttsUtils.ts

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

/**
 * Processes text to highlight the currently spoken word
 * @param text - The original text content
 * @param wordTimestamps - Array of word timestamps from TTS
 * @param currentWordIndex - Index of the currently spoken word
 * @param isPlaying - Whether TTS is currently playing
 * @returns Object with type ('markdown' | 'html') and processed content
 */
export const processTextForTTS = (
  text: string,
  wordTimestamps: WordTimestamp[],
  currentWordIndex: number,
  isPlaying: boolean
): { type: "markdown" | "html"; content: string } => {
  // Return markdown if not playing or no valid data
  if (!isPlaying || wordTimestamps.length === 0 || currentWordIndex === -1) {
    return { type: "markdown", content: text };
  }

  const currentWord = wordTimestamps[currentWordIndex]?.word;
  if (!currentWord) {
    return { type: "markdown", content: text };
  }

  // Create highlighted text using simple sequential search
  const highlightedText = highlightWordSequentially(
    text,
    wordTimestamps,
    currentWordIndex
  );

  // Convert basic markdown formatting to HTML
  const htmlContent = convertBasicMarkdownToHtml(highlightedText);

  return { type: "html", content: htmlContent };
};

/**
 * Simple sequential word highlighting - finds the Nth occurrence of words in order
 * @param text - Original text
 * @param wordTimestamps - Array of word timestamps
 * @param currentWordIndex - Current word index to highlight
 * @returns Text with highlighted word
 */
const highlightWordSequentially = (
  text: string,
  wordTimestamps: WordTimestamp[],
  currentWordIndex: number
): string => {
  let searchStartPosition = 0;
  let result = text;

  // Find positions of all words up to and including current word
  for (let i = 0; i <= currentWordIndex && i < wordTimestamps.length; i++) {
    const word = wordTimestamps[i].word;

    // Find the next occurrence of this word (case insensitive)
    const searchText = text.substring(searchStartPosition).toLowerCase();
    const wordLower = word.toLowerCase();
    const wordIndex = searchText.indexOf(wordLower);

    if (wordIndex === -1) {
      console.warn(`"${word}" not found in remaining text`);
      break;
    }

    const absolutePosition = searchStartPosition + wordIndex;

    // If this is the word we want to highlight
    if (i === currentWordIndex) {
      // Split text and insert highlight
      const before = text.substring(0, absolutePosition);
      const wordToHighlight = text.substring(
        absolutePosition,
        absolutePosition + word.length
      );
      const after = text.substring(absolutePosition + word.length);

      result = `${before}<span class="rounded text-primary">${wordToHighlight}</span>${after}`;
      break;
    }

    // Move search position past this word
    searchStartPosition = absolutePosition + word.length;
  }

  return result;
};

/**
 * Even simpler approach - just find word positions without regex
 * @param text - Original text
 * @param wordTimestamps - Array of word timestamps
 * @param currentWordIndex - Current word index to highlight
 * @returns Text with highlighted word
 */
const highlightWordSimple = (
  text: string,
  wordTimestamps: WordTimestamp[],
  currentWordIndex: number
): string => {
  const currentWord = wordTimestamps[currentWordIndex]?.word;
  if (!currentWord) {
    return text;
  }

  // Count how many times we've seen this word before in the sequence
  let wordCount = 0;
  for (let i = 0; i < currentWordIndex; i++) {
    if (wordTimestamps[i].word.toLowerCase() === currentWord.toLowerCase()) {
      wordCount++;
    }
  }

  // Find the Nth occurrence of this word
  let searchPos = 0;
  let foundCount = 0;

  while (searchPos < text.length) {
    const wordIndex = text
      .toLowerCase()
      .indexOf(currentWord.toLowerCase(), searchPos);
    if (wordIndex === -1) break;

    if (foundCount === wordCount) {
      // Highlight this occurrence
      const before = text.substring(0, wordIndex);
      const word = text.substring(wordIndex, wordIndex + currentWord.length);
      const after = text.substring(wordIndex + currentWord.length);

      return `${before}<span class="text-primary rounded ">${word}</span>${after}`;
    }

    foundCount++;
    searchPos = wordIndex + currentWord.length;
  }

  console.warn(
    `❌ Could not find occurrence #${wordCount + 1} of "${currentWord}"`
  );
  return text;
};

/**
 * Converts basic markdown formatting to HTML
 * @param text - Text with markdown formatting
 * @returns HTML string
 */
const convertBasicMarkdownToHtml = (text: string): string => {
  return (
    text
      // Convert line breaks first
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>")
      // Convert formatting
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Convert headers
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
      // Convert links and code
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-blue-600 hover:underline">$1</a>'
      )
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-gray-100 px-1.5 py-1 rounded-md">$1</code>'
      )
      // Wrap everything in a single paragraph if it doesn't start with a block element
      .replace(/^(?!<[h1-6]|<p)/m, "<p>")
      .replace(/(?<!<\/[h1-6]>|<\/p>)$/m, "</p>")
  );
};

/**
 * Gets the currently spoken word from TTS state
 * @param wordTimestamps - Array of word timestamps
 * @param currentWordIndex - Current word index
 * @returns The current word or null
 */
export const getCurrentSpokenWord = (
  wordTimestamps: WordTimestamp[],
  currentWordIndex: number
): string | null => {
  if (wordTimestamps.length === 0 || currentWordIndex === -1) {
    return null;
  }
  return wordTimestamps[currentWordIndex]?.word || null;
};

/**
 * Custom CSS classes for TTS highlighting
 */
export const TTS_HIGHLIGHT_CLASSES = {
  highlight: "bg-primary rounded transition-colors duration-200",
  container:
    "prose prose-sm sm:prose-base lg:prose-lg prose-slate dark:prose-invert max-w-none prose-a:text-blue-600 hover:prose-a:underline prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-1 prose-code:rounded-md",
};
