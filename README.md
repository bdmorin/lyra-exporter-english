# Lyra's Exporter

A comprehensive tool for retrieving, managing, and exporting conversation records from Claude, Gemini, NotebookLM, and other AI platforms.

## Features

- 📁 **File Management**: Load multiple conversation JSON files from Claude, Gemini, NotebookLM, and Google AI Studio platforms
- 🔍 **Smart Search**: Search message content, find conversations with image attachments, thinking processes, and created Artifacts
- 🏷️ **Marking System**: Mark messages as completed, important, or deleted, with format preservation during export
- 📤 **Flexible Export**: Export to Markdown format with batch export support
- 🌳 **Branch Detection**: Automatically detect and display conversation branches
- ✉️  **Full-Featured Reading**: Intelligently recognize image attachments, thinking processes, and Markdown syntax

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
```

## Usage

1. Click the "Load Files" button and select JSON files exported from Claude and other platforms
2. View file list and message list on the left side
3. Click messages to view details (content, thinking process, Artifacts)
4. Use search functionality to quickly locate messages
5. Mark important or completed messages
6. Export desired conversation content

## Development Guide

### 1. Supported File Formats

- **Claude Single Conversation** (`claude`) - Contains all messages from a single conversation
- **Claude Conversation List** (`claude_conversations`) - Contains only conversation summaries
- **Claude Full Export** (`claude_full_export`) - Contains multiple complete conversations in export file
- **Gemini/NotebookLM** (`gemini_notebooklm`) - Supports conversation formats from Gemini, NotebookLM, and Google AI Studio

### 2. Main Feature Modules

#### Message Management

- **Search Functionality**: Filter mode that displays only matching messages
- **Marking System**: Support for marking messages as completed (✓), important (⭐), or deleted (🗑️)
- **Custom Sorting**: Manual message order adjustment using up/down move buttons
- **Conversation Folding**: Collapse/expand conversations for easier browsing of long conversation lists
- **Virtual Scrolling**: Automatically enabled when messages exceed 100 items for improved performance

#### View Modes (Full Export Format Only)

- **All Messages**: Display all messages from all conversations
- **By Conversation**: Select specific conversations to view their messages
- **By Project**: Select specific projects to view related conversations and messages
- **Desktop**: Left panel displays conversation/project selector
- **Mobile**: Same view selection experience as desktop

#### Export Features

- Export to Markdown format
- Support filtering export by marks
- Preserve original format and structure
- Support export in custom sorted order

## Tech Stack

- React 18
- Custom Hooks for state management
- Native CSS styling
- localStorage persistence

## License

MIT