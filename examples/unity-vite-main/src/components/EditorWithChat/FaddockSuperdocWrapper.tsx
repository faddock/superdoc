import { useRef, useEffect } from 'react';
import { SuperDoc } from 'faddock-superdoc';
import 'faddock-superdoc/style.css';

/**
 * React wrapper for FaddockSuperdoc ES6 class.
 * Usage: <FaddockSuperdocWrapper documents={[...]} otherProps={...} />
 */
type Document = {
  id: string;
  type: string;
  data: unknown;
};

type FaddockSuperdocWrapperProps = {
  documents?: Document[];
  onAddToChat?: (selectedText: string) => void;
  onSuperdocReady?: (instance: SuperDoc) => void;
  [key: string]: unknown;
};
export default function FaddockSuperdocWrapper({
  onAddToChat,
  ...rest
}: FaddockSuperdocWrapperProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const superDocInstance = useRef<SuperDoc | null>(null);
  const onAddToChatRef = useRef(onAddToChat);

  // Update the ref when onAddToChat changes, without recreating SuperDoc
  useEffect(() => {
    onAddToChatRef.current = onAddToChat;
  }, [onAddToChat]);

  useEffect(() => {
    if (!containerRef.current) return;

    superDocInstance.current = new SuperDoc({
      selector: '#superdoc',
      toolbar: '#superdoc-toolbar',
      document: null,
      // autocompleteApiUrl: 'http://localhost:58414/api/v1/autocomplete/',
      autocompleteApiUrl: 'http://localhost:8400/api/v1/autocomplete',
      documentMode: 'editing',
      pagination: true,
      rulers: true,
      onAddToChat: (selectedText: string) => {
        // Log the selected text
        console.log(
          '📄 Selected text added to chat:',
          selectedText.substring(0, 100) + '...',
        );
        console.log('📄 Selected text length:', selectedText.length);

        // Use the ref so we always call the latest version
        if (onAddToChatRef.current) {
          onAddToChatRef.current(selectedText);
        }
      },
      ...rest, // allow other props through
    });

    // Notify parent that SuperDoc is ready
    if (rest.onSuperdocReady && superDocInstance.current) {
      rest.onSuperdocReady(superDocInstance.current);
    }

    // Clean up on unmount
    return () => {
      if (
        superDocInstance.current &&
        typeof superDocInstance.current.destroy === 'function'
      ) {
        superDocInstance.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '98%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        id="superdoc-toolbar"
        style={{
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          flex: 1,
          overflowY: 'auto',
          paddingTop: '10px',
        }}
      >
        <div
          ref={containerRef}
          id="superdoc"
          className="faddock-superdoc-center"
          style={{
            width: '100%',
            maxWidth: 900,
          }}
        />
      </div>
    </div>
  );
}
