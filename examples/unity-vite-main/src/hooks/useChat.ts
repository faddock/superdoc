import { useState, useCallback } from 'react';
import type { ChatMessage, ChatContext } from '../types/chat';

interface UseChatOptions {
  /** API endpoint for sending messages */
  apiEndpoint?: string;
  /** Initial messages */
  initialMessages?: ChatMessage[];
  /** Maximum tokens for response */
  maxTokens?: number;
  /** Document section context */
  documentSection?: string;
  /** Whether to include full document context in requests */
  documentContextEnabled?: boolean;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (content: string, context?: ChatContext) => Promise<void>;
  clearMessages: () => void;
}

/**
 * Hook for managing chat messages and API calls
 * Calls the backend superdoc chat API
 */
export const useChat = ({
  apiEndpoint,
  initialMessages = [],
  maxTokens = 4096,
  documentSection = '',
  documentContextEnabled = true,
}: UseChatOptions = {}): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(
    async (content: string, context?: ChatContext) => {
      // Add user message (display original content to user)
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };

      // Store current messages including the new user message for API call
      let currentMessages: ChatMessage[] = [];
      setMessages((prev) => {
        currentMessages = [...prev, userMessage];
        return currentMessages;
      });

      setIsStreaming(true);

      // Add empty assistant message to show "Processing..." indicator
      const assistantPlaceholder: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantPlaceholder]);

      try {
        if (apiEndpoint) {
          // Convert chat history to backend API format
          const apiMessages = currentMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));

          // Prepare request body with document context if available
          const requestBody: {
            messages: { role: string; content: string }[];
            document_section: string;
            document_context?: string;
            stream: boolean;
            max_tokens: number;
          } = {
            messages: apiMessages,
            document_section: context?.fullText || documentSection,
            stream: false,
            max_tokens: maxTokens,
          };

          // Only include document context if enabled and available
          if (documentContextEnabled && context?.documentContext) {
            requestBody.document_context = context.documentContext;
          }

          // Make API call to backend superdoc chat endpoint
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            throw new Error(
              `API request failed: ${response.status} ${response.statusText}`,
            );
          }

          const data = await response.json();

          // Extract response content from backend API format
          // The backend returns: { completion: { role: string, content: string } }
          let responseContent = 'Sorry, I could not process your request.';

          if (data.completion?.content) {
            // Content is now a simple string
            responseContent = data.completion.content;
          }

          // Update the placeholder message with actual content
          setMessages((prev) => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = responseContent;
            }
            return updated;
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);

        // Update the placeholder message with error content
        const errorContent =
          error instanceof Error
            ? `Error: ${error.message}`
            : 'Sorry, there was an error processing your message. Please try again.';

        setMessages((prev) => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = errorContent;
          }
          return updated;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [apiEndpoint, maxTokens, documentSection, documentContextEnabled],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    clearMessages,
  };
};
