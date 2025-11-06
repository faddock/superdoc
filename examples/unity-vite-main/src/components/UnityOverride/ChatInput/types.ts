import type { CSSProperties, KeyboardEvent, ChangeEvent } from 'react';
import type { ChatContext } from '../../../types/chat';

export interface ChatInputStrictProps {
  /**
   * Bottom slot to insert chatInput controls (send button, file upload, etc.)
   */
  bottom?: React.ReactNode;
  /**
   * The className to pass to the bottom slot.
   */
  bottomClassName?: string;
  /**
   * The className to pass to the underlying textarea element.
   */
  textareaClassName?: string;
  /**
   * The style to pass to the underlying textarea element.
   */
  textareaStyle?: CSSProperties;
  /**
   * Sets the max number of lines the underlying textarea can auto grow to.
   *
   * @default 8
   */
  maxRows?: number;
  /**
   * The className to pass to the root wrapper element.
   */
  className?: string;
  /**
   * The style to pass to the root wrapper element.
   */
  style?: CSSProperties;
  /**
   * Callback when Enter key is pressed (without Shift).
   * If provided, Enter will submit and Shift+Enter will add new line.
   */
  onSubmit?: (value: string) => void;
  /**
   * Whether the component is in a submitting state (disables Enter key submission).
   */
  isSubmitting?: boolean;
  /**
   * Context object to display inside the chat input (above textarea).
   */
  context?: ChatContext | null;
  /**
   * Callback when the context clear button is clicked.
   */
  onClearContext?: () => void;
  /**
   * Callback when files are selected (for future file upload functionality).
   */
  onFileUpload?: (files: FileList) => void;
  /**
   * Whether document context is enabled.
   */
  documentContextEnabled?: boolean;
  /**
   * Callback when the document context toggle is clicked.
   */
  onToggleDocumentContext?: () => void;
}

export interface TextareaProps {
  placeholder?: string;
  rows?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onInput?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
  readOnly?: boolean;
}

export type ChatInputProps = ChatInputStrictProps & TextareaProps;
