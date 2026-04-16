```markdown
# zqremovels Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns, coding conventions, and repository workflows used in the `zqremovels` JavaScript codebase. You'll learn how to structure files, manage dependencies, write and organize code, and follow the project's conventions for imports, exports, and testing.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `myUtilityFile.js`

### Import Style
- Use **relative imports** for modules within the project.
  ```javascript
  import { myFunction } from './utils/myUtilityFile';
  ```

### Export Style
- Use **named exports** (not default exports).
  ```javascript
  // In utils/myUtilityFile.js
  export function myFunction() { /* ... */ }
  ```

### Commit Messages
- Freeform style, sometimes with prefixes.
- Average length: ~60 characters.
  - Example: `fix bug in dependency removal logic`

## Workflows

### Manage Node Modules and Dependencies
**Trigger:** When you need to add, update, or remove tracked `node_modules` or adjust dependency tracking.
**Command:** `/manage-node-modules`

1. Add or remove files and folders under `node_modules/` as needed.
2. Update `.gitignore` to include or exclude `node_modules/` according to the new dependency management state.
3. Commit changes reflecting the new dependency management state.

**Files Involved:**
- `node_modules/.package-lock.json`
- `node_modules/detect-libc/*`
- `node_modules/lightningcss-linux-x64-gnu/*`
- `node_modules/lightningcss/*`
- `.gitignore`

**Example:**
```bash
# Remove a dependency
rm -rf node_modules/lightningcss/
# Update .gitignore to ignore node_modules/
echo "node_modules/" >> .gitignore
# Commit the changes
git add .gitignore
git rm -r --cached node_modules/
git commit -m "Remove lightningcss and update .gitignore"
```

## Testing Patterns

- Test files follow the pattern: `*.test.*`
  - Example: `utils.test.js`
- Testing framework is **unknown**; check existing test files for conventions.
- Place tests alongside the code or in a dedicated test directory.

**Example:**
```javascript
// utils.test.js
import { myFunction } from './myUtilityFile';

test('myFunction returns expected result', () => {
  expect(myFunction(2)).toBe(4);
});
```

## Commands
| Command               | Purpose                                                      |
|-----------------------|--------------------------------------------------------------|
| /manage-node-modules  | Manage node_modules and update dependency tracking           |
```
