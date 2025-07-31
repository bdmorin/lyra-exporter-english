# CRUSH Configuration

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
- Graceful fallbacks for missing data (e.g., `dateStr || '未知时间'`)
- Error state management in custom hooks