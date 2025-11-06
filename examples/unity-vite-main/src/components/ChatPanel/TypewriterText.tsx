import { useState, useEffect, useRef } from 'react';
import { Typography } from '@abbvie-unity/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TypewriterTextProps {
  content: string;
  onComplete?: () => void;
  isStreaming?: boolean;
  isStopping?: boolean;
  wordTypingSpeed?: number;
}

export const TypewriterText = ({
  content,
  onComplete,
  isStreaming,
  isStopping = false,
  wordTypingSpeed = 5,
}: TypewriterTextProps) => {
  const [visibleWords, setVisibleWords] = useState(0);
  const words = useRef<{ text: string; endIndex: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Split content into words and special constructs like links
  useEffect(() => {
    const regex = /(\[[^\]]+\]\([^)]*\))|(\S+\s*)|(\s+)/g;
    const arr: { text: string; endIndex: number }[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      arr.push({ text: match[0], endIndex: match.index + match[0].length });
    }
    words.current = arr;
  }, [content]);

  // When isStopping becomes true, immediately show all content
  useEffect(() => {
    if (isStopping) {
      setVisibleWords(words.current.length);
      onComplete?.();
    }
  }, [isStopping, onComplete]);

  // Word-by-word typewriter effect
  useEffect(() => {
    if (isStopping) return;
    if (visibleWords >= words.current.length) {
      if (onComplete && !isStreaming) onComplete();
      return;
    }

    const timer = setTimeout(
      () => setVisibleWords((v) => v + 1),
      wordTypingSpeed,
    );

    return () => clearTimeout(timer);
  }, [visibleWords, wordTypingSpeed, onComplete, isStreaming, isStopping]);

  // Build display content from visible words
  const getDisplayContent = () => {
    if (visibleWords >= words.current.length) {
      return content;
    }

    let result = '';
    for (let i = 0; i < visibleWords; i++) {
      result += words.current[i].text;
    }

    // Check for incomplete links
    const incompleteLinkPattern = /\[([^\]]+)\]\([^)]*$/;
    const match = result.match(incompleteLinkPattern);
    if (match) {
      const label = match[1];
      return result.replace(incompleteLinkPattern, `${label}`);
    }

    return result;
  };

  return (
    <div
      className="typewriter-container"
      style={{
        maxHeight: '60vh',
        maxWidth: '100%',
        overflowY: 'auto',
        overflowX: 'auto',
      }}
    >
      <div ref={containerRef}>
        <Typography className="prose prose-sm max-w-none leading-relaxed [&_pre]:overflow-x-auto [&_table]:overflow-x-auto [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {getDisplayContent()}
          </ReactMarkdown>
        </Typography>
      </div>
    </div>
  );
};
