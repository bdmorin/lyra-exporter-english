# CRUSH Configuration

## Project Information
This is an English translation fork of [Yalums' Lyra's Exporter](https://github.com/Yalums/lyra-exporter).  
**Original Author:** [Yalums](https://github.com/Yalums)  
**English Fork Maintainer:** [bdmorin](https://github.com/bdmorin)

## Build/Test/Lint Commands
```bash
npm install                    # Install dependencies
npm start                      # Start dev server (localhost:3789)
npm run start:local           # Start dev server (local only)
npm run start:network         # Start dev server (network accessible)
npm run build                 # Build for production
npm run deploy                # Deploy to GitHub Pages
npm run tauri:dev             # Start Tauri development
npm run tauri:build           # Build Tauri app
```

## Code Style Guidelines

### File Organization
- Components in `src/components/` with PascalCase names
- Custom hooks in `src/hooks/` prefixed with `use`
- Utilities in `src/utils/` with camelCase names
- Styles in `src/styles/` with kebab-case names

### Import Style
- React imports first, then external libraries, then local imports
- Group imports: React → external → components → hooks → utils
- Use relative imports for local files

### Naming Conventions
- Components: PascalCase (e.g., `ConversationGrid`)
- Hooks: camelCase with `use` prefix (e.g., `useFileManager`)
- Constants: UPPER_SNAKE_CASE (e.g., `MARK_TYPES`)
- Functions/variables: camelCase

### React Patterns
- Use functional components with hooks
- Custom hooks for complex state logic
- Destructure props in function parameters
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive calculations

### Error Handling
- Try-catch blocks for async operations and JSON parsing
- Graceful fallbacks for missing data (e.g., `dateStr || 'Unknown time'`)
- Error state management in custom hooks

### Translation Guidelines
- All user-facing text should be in English
- Maintain original functionality while translating interface
- Keep console messages in English for debugging
- Preserve original author attribution in all files