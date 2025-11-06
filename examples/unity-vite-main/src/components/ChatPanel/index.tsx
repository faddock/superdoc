import {
  ChatBubble,
  ChatBubbleRow,
  Typography,
  Button,
  Icon,
  Spinner,
} from '@abbvie-unity/react';
import ChatInput from '../UnityOverride/ChatInput';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, ChatContext } from '../../types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TypewriterText } from './TypewriterText';

interface ChatPanelProps {
  /** Array of chat messages */
  messages: ChatMessage[];
  /** Callback when user sends a message */
  onSendMessage: (message: string, context?: ChatContext) => void;
  /** Whether the assistant is currently typing/streaming */
  isStreaming?: boolean;
  /** Placeholder text for input */
  placeholder?: string;
  /** Whether to show the input */
  showInput?: boolean;
  /** Context from highlighted text */
  context?: ChatContext | null;
  /** Callback to clear context */
  onClearContext?: () => void;
  /** Whether document context is enabled */
  documentContextEnabled?: boolean;
  /** Callback to toggle document context */
  onToggleDocumentContext?: () => void;
  /** Function to get full document context */
  getDocumentContext?: () => string | undefined;
}

export const ChatPanel = ({
  messages,
  onSendMessage,
  isStreaming = false,
  placeholder = 'Type your message here...',
  showInput = true,
  context = null,
  onClearContext,
  documentContextEnabled = true,
  onToggleDocumentContext,
  getDocumentContext,
}: ChatPanelProps) => {
  const [inputValue, setInputValue] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to show the latest message
  useEffect(() => {
    if (messages.length === 0 || !messagesContainerRef.current) return;

    // Scroll to show the latest message
    setTimeout(() => {
      if (!messagesContainerRef.current) return;

      const container = messagesContainerRef.current;
      const allMessages = container.querySelectorAll('[data-message-id]');
      const lastMessageElement = allMessages[
        allMessages.length - 1
      ] as HTMLElement;

      if (lastMessageElement) {
        const messageTop = lastMessageElement.offsetTop;
        container.scrollTo({
          top: messageTop - 100,
          behavior: 'smooth',
        });
      }
    }, 100);
  }, [messages]);

  const handleSubmit = useCallback(
    (message: string) => {
      if (message.trim() && !isStreaming) {
        // Get document context if toggle is enabled
        let contextToSend = context;

        if (documentContextEnabled && getDocumentContext) {
          const fullDocumentContext = getDocumentContext();
          console.log(
            '🔄 Document context toggle is ON, fetched context length:',
            fullDocumentContext?.length || 0,
          );

          contextToSend = context
            ? { ...context, documentContext: fullDocumentContext }
            : {
                preview: '',
                fullText: '',
                documentContext: fullDocumentContext,
              };
        } else {
          console.log(
            '❌ Document context toggle is OFF, not fetching context',
          );
        }

        onSendMessage(message.trim(), contextToSend || undefined);
        setInputValue(''); // Clear the input
        // Clear context after sending
        if (onClearContext) {
          onClearContext();
        }
      }
    },
    [
      isStreaming,
      context,
      onSendMessage,
      onClearContext,
      documentContextEnabled,
      getDocumentContext,
    ],
  );

  // Helper function to convert HTML to Word-compatible format for SuperDoc
  const convertToWordHtml = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    let listIdCounter = 0;
    let listFormatIdCounter = 0;
    const listStyles: string[] = [];
    const outputElements: string[] = [];

    // Helper to get text content without nested lists
    const getTextContent = (element: Element): string => {
      let text = '';
      for (const node of Array.from(element.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          const tagName = el.tagName.toLowerCase();
          // Skip nested lists, process inline elements
          if (tagName !== 'ul' && tagName !== 'ol') {
            text += el.outerHTML;
          }
        }
      }
      return text.trim();
    };

    // Process elements recursively
    const processElement = (
      element: Element,
      listLevel = 0,
      currentListId = 0,
      currentLfoId = 0,
    ): void => {
      const tagName = element.tagName.toLowerCase();

      // Handle lists
      if (tagName === 'ul' || tagName === 'ol') {
        const isOrdered = tagName === 'ol';
        const newListId = listIdCounter++;
        const newLfoId = listFormatIdCounter++;
        const items = Array.from(element.children).filter(
          (child) => child.tagName.toLowerCase() === 'li',
        );

        // Generate @list CSS rule for this list level
        const marginLeft = 36 * (listLevel + 1);
        const format = isOrdered ? 'decimal' : 'bullet';
        const levelText = isOrdered ? `"%${listLevel + 1}."` : '•';

        listStyles.push(`
@list l${newListId}:level${listLevel + 1} lfo${newLfoId} {
  mso-level-number-format: ${format};
  mso-level-text: ${levelText};
  margin-left: ${marginLeft}pt;
}`);

        // Process each list item
        items.forEach((li, index) => {
          const marker = isOrdered ? `${index + 1}.` : '•';
          const textContent = getTextContent(li);

          if (textContent) {
            outputElements.push(
              `<p style="mso-list: l${newListId} level${listLevel + 1} lfo${newLfoId}; margin-left: ${marginLeft}pt; text-indent: -18pt;"><!--[if !supportLists]--><span>${marker}</span><span style="font-size:7pt">&nbsp;&nbsp;&nbsp;</span><!--[endif]-->${textContent}</p>`,
            );
          }

          // Process nested lists
          const nestedLists = Array.from(li.children).filter(
            (child) =>
              child.tagName.toLowerCase() === 'ul' ||
              child.tagName.toLowerCase() === 'ol',
          );
          nestedLists.forEach((nested) =>
            processElement(nested, listLevel + 1, newListId, newLfoId),
          );
        });
      }
      // Handle headings
      else if (tagName.match(/^h[1-6]$/)) {
        const levelChar = tagName.charAt(1);
        const level = parseInt(levelChar, 10);
        const fontSize = 20 - level * 2;
        outputElements.push(
          `<p style="font-weight: bold; font-size: ${fontSize}pt; margin-top: 12pt; margin-bottom: 6pt;">${element.innerHTML}</p>`,
        );
      }
      // Handle paragraphs
      else if (tagName === 'p') {
        outputElements.push(
          `<p style="margin-top: 0pt; margin-bottom: 12pt;">${element.innerHTML}</p>`,
        );
      }
      // Handle other block elements
      else if (['div', 'section', 'article', 'blockquote'].includes(tagName)) {
        // Process children of block elements
        Array.from(element.children).forEach((child) =>
          processElement(child, listLevel, currentListId, currentLfoId),
        );
      }
      // Handle inline elements or unknown elements - add as paragraph
      else {
        outputElements.push(`<p>${element.outerHTML}</p>`);
      }
    };

    // Process all top-level elements
    Array.from(body.children).forEach((child) => processElement(child));

    // Build final HTML with style block
    const styleBlock =
      listStyles.length > 0 ? `<style>${listStyles.join('\n')}</style>` : '';

    const wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
  <meta name="Generator" content="Microsoft Word">
  ${styleBlock}
</head>
<body>
  ${outputElements.join('\n')}
</body>
</html>`;

    return wordHtml;
  };

  const handleCopy = useCallback(
    async (content: string, messageId: string, element?: HTMLElement) => {
      try {
        // Try to get the rendered HTML from the message element
        let html = '';
        if (element) {
          // Find the Typography/prose container with the rendered markdown
          const proseContainer = element.querySelector('.prose');
          if (proseContainer) {
            html = proseContainer.innerHTML;
          }
        }

        if (html) {
          // Convert to Word-compatible HTML for better SuperDoc compatibility
          const wordHtml = convertToWordHtml(html);

          // Copy both HTML and plain text formats
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': new Blob([wordHtml], { type: 'text/html' }),
              'text/plain': new Blob([content], { type: 'text/plain' }),
            }),
          ]);
        } else {
          // Fallback to plain text if we can't get HTML
          await navigator.clipboard.writeText(content);
        }

        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
      } catch (err) {
        console.error('Copy failed:', err);
        // Final fallback to plain text
        try {
          await navigator.clipboard.writeText(content);
          setCopiedMessageId(messageId);
          setTimeout(() => setCopiedMessageId(null), 2000);
        } catch (fallbackErr) {
          console.error('Fallback copy also failed:', fallbackErr);
        }
      }
    },
    [],
  );

  const handleEmail = useCallback((content: string) => {
    const subject = encodeURIComponent('Shared from Chat');
    const body = encodeURIComponent(content);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, []);

  const handleTryAgain = useCallback(
    (messageIndex: number) => {
      // Find the user message that prompted this assistant response
      if (messageIndex > 0) {
        const previousMessage = messages[messageIndex - 1];
        if (previousMessage && previousMessage.role === 'user') {
          onSendMessage(previousMessage.content, context || undefined);
        }
      }
    },
    [messages, onSendMessage, context],
  );

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex min-h-0 flex-col overflow-x-hidden overflow-y-auto px-4 py-4"
        style={{ flex: '1 1 auto', scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-400">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-300"
            >
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <Typography className="text-center text-sm text-gray-500">
              Start a conversation
            </Typography>
          </div>
        ) : (
          <div
            className="flex flex-col gap-4"
            style={{ paddingBottom: '40vh' }}
          >
            {messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              const isStreamingThisMessage = isStreaming && isLastMessage;
              const showLoadingSpinner =
                isStreamingThisMessage &&
                !message.content &&
                message.role === 'assistant';

              return (
                <ChatBubbleRow
                  key={message.id}
                  className="animate-[fadeIn_0.3s_ease-in-out]"
                  data-role={message.role}
                  data-message-id={message.id}
                  style={{
                    flexDirection: 'column',
                    paddingBlock: 'var(--un-semantic-spacing-2)',
                    rowGap: 'var(--un-semantic-spacing-2)',
                  }}
                >
                  <ChatBubble variant={message.role}>
                    {message.role === 'user' && (
                      <div
                        style={{
                          left: '-2.5rem',
                          position: 'absolute',
                          top: '4px',
                        }}
                      >
                        <Button
                          aria-label={
                            copiedMessageId === message.id
                              ? 'copied!'
                              : 'copy message'
                          }
                          shape="circle"
                          size="small"
                          variant="tertiary"
                          onClick={(e) => {
                            const chatBubbleRow = (
                              e.target as HTMLElement
                            ).closest('[data-message-id]') as HTMLElement;
                            handleCopy(
                              message.content,
                              message.id,
                              chatBubbleRow,
                            );
                          }}
                        >
                          <Icon
                            icon={
                              copiedMessageId === message.id ? 'check' : 'copy'
                            }
                          />
                        </Button>
                      </div>
                    )}
                    {showLoadingSpinner ? (
                      <div className="flex items-center gap-2 py-2">
                        <Spinner size={16} thickness={2} />
                        <Typography className="text-sm text-gray-600">
                          Processing your prompt...
                        </Typography>
                      </div>
                    ) : // Use TypewriterText for smooth streaming animation
                    message.role === 'assistant' ? (
                      <TypewriterText
                        content={message.content}
                        isStreaming={isStreamingThisMessage}
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none leading-relaxed break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </ChatBubble>
                  {message.role === 'assistant' && !isStreamingThisMessage && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 'var(--un-semantic-spacing-3)',
                      }}
                    >
                      <Button
                        aria-label={
                          copiedMessageId === message.id
                            ? 'copied!'
                            : 'copy message'
                        }
                        shape="circle"
                        size="small"
                        variant="tertiary"
                        onClick={(e) => {
                          const chatBubbleRow = (
                            e.target as HTMLElement
                          ).closest('[data-message-id]') as HTMLElement;
                          handleCopy(
                            message.content,
                            message.id,
                            chatBubbleRow,
                          );
                        }}
                      >
                        <Icon
                          icon={
                            copiedMessageId === message.id ? 'check' : 'copy'
                          }
                        />
                      </Button>
                      <Button
                        aria-label="email"
                        shape="circle"
                        size="small"
                        variant="tertiary"
                        onClick={() => handleEmail(message.content)}
                      >
                        <Icon icon="envelope" />
                      </Button>
                      <Button
                        aria-label="try again"
                        shape="circle"
                        size="small"
                        variant="tertiary"
                        onClick={() => handleTryAgain(index)}
                      >
                        <Icon icon="rotate-right" />
                      </Button>
                    </div>
                  )}
                </ChatBubbleRow>
              );
            })}
          </div>
        )}
      </div>

      {/* Input area with integrated context display */}
      {showInput && (
        <div className="px-4 pb-4" style={{ flex: '0 0 auto' }}>
          <ChatInput
            bottom={
              <div
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                {/* <Button
                  aria-label="Attach file"
                  shape="circle"
                  size="small"
                  variant="tertiary"
                  disabled={isStreaming}
                >
                  <Icon icon="paperclip" />
                </Button> */}
                <Button
                  aria-label="Submit"
                  shape="circle"
                  size="small"
                  variant="primary"
                  disabled={isStreaming}
                  onClick={() => handleSubmit(inputValue)}
                >
                  <Icon icon="send" />
                </Button>
              </div>
            }
            maxRows={8}
            name="message"
            placeholder={placeholder}
            rows={1}
            disabled={isStreaming}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onSubmit={handleSubmit}
            isSubmitting={isStreaming}
            context={context}
            onClearContext={onClearContext}
            documentContextEnabled={documentContextEnabled}
            onToggleDocumentContext={onToggleDocumentContext}
          />
        </div>
      )}
    </div>
  );
};
