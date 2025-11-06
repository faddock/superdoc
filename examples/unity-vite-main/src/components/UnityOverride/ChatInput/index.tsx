import { Icon } from '@abbvie-unity/react';
import clsx from 'clsx';
import React, { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import classes from './ChatInput.module.scss';
import type { ChatInputProps } from './types';

/**
 * A multi-line text input component that automatically grows with text,
 * for use within a Chat interface. Includes integrated context display
 * and Enter-to-send functionality.
 */
const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput(
    {
      className,
      style,
      placeholder = 'Type your message here...',
      rows = 1,
      maxRows = 8,
      bottom,
      bottomClassName,
      textareaClassName,
      textareaStyle,
      value,
      defaultValue,
      onSubmit,
      isSubmitting,
      context,
      onClearContext,
      documentContextEnabled = true,
      onToggleDocumentContext,
      onKeyDown,
      onChange,
      disabled,
      ...props
    }: ChatInputProps,
    ref,
  ) {
    const textareaWrapperRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isControlled = value !== undefined;

    // Handle Enter key for submission
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Call custom onKeyDown if provided
      onKeyDown?.(e);

      // Handle Enter key submission (Enter alone submits, Shift+Enter for new line)
      if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
        e.preventDefault();
        const currentValue = isControlled ? value : textareaRef.current?.value;
        if (currentValue?.trim() && !isSubmitting && !disabled) {
          onSubmit(currentValue);
        }
      }
    };

    // Merge refs helper
    const mergeRefs = (
      ...refs: Array<
        | React.Ref<HTMLTextAreaElement>
        | React.MutableRefObject<HTMLTextAreaElement | null>
      >
    ) => {
      return (element: HTMLTextAreaElement | null) => {
        refs.forEach((r) => {
          if (typeof r === 'function') {
            r(element);
          } else if (r != null) {
            (r as React.MutableRefObject<HTMLTextAreaElement | null>).current =
              element;
          }
        });
      };
    };

    return (
      <div
        className={clsx(classes.root, className)}
        style={
          {
            ...(rows ? { '--min-rows': rows } : {}),
            ...(maxRows ? { '--max-rows': maxRows } : {}),
            ...style,
          } as React.CSSProperties
        }
      >
        {/* Textarea container with grid layout for auto-growing */}
        <div
          ref={textareaWrapperRef}
          data-replicated-value={isControlled ? value : (defaultValue ?? '')}
          className={classes.textareaContainer}
          role="button"
          tabIndex={-1}
          onMouseDown={(e) => {
            // Click anywhere in the wrapper (but outside textarea) to focus textarea
            if (
              textareaWrapperRef.current &&
              textareaWrapperRef.current.contains(e.target as Node) &&
              !textareaRef.current?.contains(e.target as Node)
            ) {
              e.preventDefault();
              textareaRef.current?.focus();
            }
          }}
          onKeyDown={(e) => {
            // Support keyboard interaction
            if (
              (e.key === 'Enter' || e.key === ' ') &&
              e.target === textareaWrapperRef.current
            ) {
              e.preventDefault();
              textareaRef.current?.focus();
            }
          }}
        >
          <textarea
            ref={mergeRefs(ref, textareaRef)}
            placeholder={placeholder}
            {...(isControlled ? { value } : { defaultValue })}
            rows={rows}
            className={clsx(classes.textarea, textareaClassName)}
            style={textareaStyle}
            onKeyDown={handleKeyDown}
            onChange={onChange}
            disabled={disabled}
            {...props}
          />
        </div>

        {/* Bottom slot for context pill and buttons */}
        {(bottom || context || onToggleDocumentContext) && (
          <div className={clsx(classes.bottom, bottomClassName)}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                gap: '8px',
              }}
            >
              {/* Left side: Toggle and context pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: '1',
                }}
              >
                {onToggleDocumentContext && (
                  <button
                    type="button"
                    onClick={onToggleDocumentContext}
                    className={classes.toggleContainer}
                    data-enabled={documentContextEnabled}
                    aria-label={
                      documentContextEnabled
                        ? 'Exclude document context'
                        : 'Include document context'
                    }
                    tabIndex={0}
                  >
                    <div
                      className={classes.toggleButton}
                      data-enabled={documentContextEnabled}
                    >
                      <Icon
                        icon={documentContextEnabled ? 'eye' : 'eye-slash'}
                      />
                    </div>
                    <span
                      className={classes.toggleLabel}
                      data-enabled={documentContextEnabled}
                    >
                      Include Document
                    </span>
                  </button>
                )}
                {context && (
                  <div className={classes.contextPill}>
                    <span className={classes.contextText}>
                      {context.preview}
                    </span>
                    <button
                      type="button"
                      onClick={onClearContext}
                      className={classes.contextCloseButton}
                      aria-label="Clear context"
                      tabIndex={0}
                    >
                      <Icon icon="close" style={{ fontSize: '10px' }} />
                    </button>
                  </div>
                )}
              </div>
              {/* Right side: Action buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginLeft: 'auto',
                }}
              >
                {bottom}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default ChatInput;
