import { useMemo, useState, useCallback, useRef } from 'react';
import { ResizableChatPanel } from '../../components/ResizableChatPanel';
import { ChatPanel } from '../../components/ChatPanel';
import { useChat } from '../../hooks/useChat';
import type { ChatContext } from '../../types/chat';
import FaddockSuperdocWrapper from './FaddockSuperdocWrapper';
import type { SuperDoc } from 'faddock-superdoc';

interface EditorWithChatProps {
  initialContent?: string;
  documentId?: string;
}

/**
 * Reusable component that combines the Faddock Superdoc editor with a chat panel.
 * Used for editing protocol sections with AI assistance.
 */
export const EditorWithChat = ({
  initialContent,
  documentId = 'demo-doc',
}: EditorWithChatProps) => {
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [documentContextEnabled, setDocumentContextEnabled] = useState(true);
  const superdocRef = useRef<SuperDoc | null>(null);

  const handleSuperdocReady = useCallback((instance: SuperDoc) => {
    superdocRef.current = instance;
    console.log('✅ SuperDoc instance ready and stored');
  }, []);

  const getDocumentContext = useCallback(() => {
    if (
      !superdocRef.current ||
      typeof superdocRef.current.getDocumentContext !== 'function'
    ) {
      console.warn('⚠️ SuperDoc instance or getDocumentContext not available');
      return undefined;
    }
    const context = superdocRef.current.getDocumentContext();
    console.log('📄 Retrieved document context, length:', context?.length || 0);
    return context;
  }, []);

  const handleAddToChat = useCallback((selectedText: string) => {
    if (selectedText.trim()) {
      // Extract first 2 words ... last 2 words for preview
      const words = selectedText.trim().split(/\s+/);
      let preview = '';
      if (words.length <= 4) {
        // If 4 or fewer words, just show them all
        preview = words.join(' ');
      } else {
        // Show first 2 ... last 2
        const firstTwo = words.slice(0, 2).join(' ');
        const lastTwo = words.slice(-2).join(' ');
        preview = `${firstTwo} ... ${lastTwo}`;
      }

      setChatContext({
        preview: preview,
        fullText: selectedText,
      });
      console.log('AddToChat received - Selected text:', selectedText);
    }
  }, []);

  const handleClearContext = useCallback(() => {
    setChatContext(null);
  }, []);

  const handleToggleDocumentContext = useCallback(() => {
    setDocumentContextEnabled((prev) => !prev);
  }, []);

  // Initialize chat with backend API
  const { messages, isStreaming, sendMessage } = useChat({
    apiEndpoint: `${import.meta.env.VITE_BACKEND_API_URL}/api/v1/superdoc/chat`,
    documentContextEnabled,
  });

  // Memoize the documents array to prevent FaddockSuperdocWrapper from re-rendering
  const documents = useMemo(
    () => [
      {
        id: documentId,
        type: 'docx',
        data: initialContent || null,
      },
    ],
    [documentId, initialContent],
  );

  // Memoize the chat panel to prevent unnecessary re-renders of the superdoc editor
  const chatPanel = useMemo(
    () => (
      <ChatPanel
        messages={messages}
        onSendMessage={sendMessage}
        isStreaming={isStreaming}
        placeholder="Ask agent.."
        context={chatContext}
        onClearContext={handleClearContext}
        documentContextEnabled={documentContextEnabled}
        onToggleDocumentContext={handleToggleDocumentContext}
        getDocumentContext={getDocumentContext}
      />
    ),
    [
      messages,
      isStreaming,
      sendMessage,
      chatContext,
      handleClearContext,
      documentContextEnabled,
      handleToggleDocumentContext,
      getDocumentContext,
    ],
  );

  return (
    <div className="flex h-full w-full">
      <ResizableChatPanel
        defaultChatWidth={450}
        minChatWidth={300}
        maxChatWidthPercent={50}
        defaultCollapsed={false}
        chatPanel={chatPanel}
      >
        <FaddockSuperdocWrapper
          onAddToChat={handleAddToChat}
          onSuperdocReady={handleSuperdocReady}
          documents={documents}
        />
      </ResizableChatPanel>
    </div>
  );
};
