# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2025-11-04

### Added

- **Autocomplete Toggle Support**: Added event listener and handler for 'toggle-autocomplete' events

  - `SuperDoc.js` now listens for toolbar autocomplete toggle events
  - Automatically enables/disables autocomplete across all editor instances
  - Triggers immediate autocomplete API call when toggled on from cursor position
  - Implemented in `SuperDoc.onToggleAutocomplete()` method

- **Document Context in Add-to-Chat**: Enhanced add-to-chat functionality to include full document context
  - `use-add-to-chat.js` composable now extracts and passes complete document text
  - Callback signature updated: `onAddToChat(selectedText, documentText)`
  - Enables AI chat features to understand entire document context, not just selection
  - Uses ProseMirror's `doc.textBetween(0, doc.content.size, '\n', '\n')` for text extraction

### Changed

- **Event Handler Integration**: Improved event coordination between SuperDoc core and editor instances
  - `onToggleAutocomplete` now calls `editor.triggerAutocomplete()` when available
  - Better separation of concerns between orchestrator and editor instances

---

[Unreleased]: https://github.com/your-org/superdoc/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/faddock/superdoc/releases/tag/v0.4.0
