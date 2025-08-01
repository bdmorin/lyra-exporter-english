# Lyra's Exporter (English Version)

A comprehensive tool for retrieving, managing, and exporting conversation records from Claude, Gemini, NotebookLM, and other AI platforms.

> **Original Author:** [Yalums](https://github.com/Yalums/lyra-exporter)  
> **English Fork:** This is an English translation of the original Chinese project  
> **Live Demo:** https://bdmorin.github.io/lyra-exporter-english

## About This Fork

This is an English translation of Yalums' excellent [Lyra's Exporter](https://github.com/Yalums/lyra-exporter) project. All core functionality remains identical to the original - only the interface language and documentation have been translated to English for international users.

**Full credit goes to [Yalums](https://github.com/Yalums) for creating this amazing tool.**

## Quick Start

### Option 1: Use Online (Recommended)
1. **Visit:** https://bdmorin.github.io/lyra-exporter-english
2. **Install the userscript** (see instructions below)
3. **Export conversations** from Claude, Gemini, etc.
4. **Load and manage** your conversations in the web interface

### Option 2: Run Locally
```bash
# Clone this English fork
git clone https://github.com/bdmorin/lyra-exporter-english.git
cd lyra-exporter-english

# Install dependencies
npm install

# Start development server
npm start
```

## Userscript Installation

To export conversations from AI platforms, you'll need to install the companion userscript:

### Step 1: Install a Userscript Manager
- **Violentmonkey** (recommended): https://violentmonkey.github.io/
- **Tampermonkey**: https://www.tampermonkey.net/

### Step 2: Install Lyra's Fetch Script
- **Visit:** https://greasyfork.org/en/scripts/540633-lyra-s-fetch
- **Click:** "Install this script"

### Step 3: Use with English Interface
The original script works perfectly with this English version:
1. Visit Claude, Gemini, Google AI Studio, or NotebookLM
2. Look for the export button (bottom right corner)
3. Export your conversations
4. Load the exported files in https://bdmorin.github.io/lyra-exporter-english

## Features

- 📁 **File Management**: Load multiple conversation JSON files from Claude, Gemini, NotebookLM, and Google AI Studio platforms
- 🔍 **Smart Search**: Search message content, find conversations with image attachments, thinking processes, and created Artifacts
- 🏷️ **Marking System**: Mark messages as completed, important, or deleted, with format preservation during export
- 📤 **Flexible Export**: Export to Markdown format with batch export support
- 🌳 **Branch Detection**: Automatically detect and display conversation branches
- ✉️  **Full-Featured Reading**: Intelligently recognize image attachments, thinking processes, and Markdown syntax

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

## Attribution & License

**Original Project:** [Lyra's Exporter](https://github.com/Yalums/lyra-exporter) by [Yalums](https://github.com/Yalums)  
**English Translation:** [bdmorin](https://github.com/bdmorin)  
**License:** MIT

This English fork maintains the same MIT license as the original project. All core functionality and design credit belongs to Yalums.