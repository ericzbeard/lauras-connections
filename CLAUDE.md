# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-file HTML implementation of a Connections-style puzzle game (inspired by NY Times Connections). The entire application—HTML, CSS, and JavaScript—is contained in `index.html`. No build process or dependencies are required.

## Running the Application

Simply open `index.html` in a web browser. No server or build step needed.

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Or use any local server:
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## Architecture

### Single-File Structure
The file contains three main sections in order:
1. **Styles** (`<style>` tag, lines 8-40): CSS custom properties, responsive grid layouts, and mobile-first design
2. **HTML Structure** (lines 42-82): Two main screens (home selector and game board) plus action bar
3. **JavaScript Logic** (`<script>` tag, lines 83-198): Game state management, LocalStorage persistence, and UI interactions

### Key Architectural Patterns

**Screen Management**
- Two screens: home selector (`#homeScreen`) and game board (`#gameScreen`)
- `showHome()` and `showGame()` toggle visibility and manage navigation state
- The home screen displays a grid of all available puzzles with status indicators (unsolved ⬜, solved ✅, failed ✖️)

**State Management**
- Global `state` object (line 92) tracks: current puzzle data, word order, player selections, found groups, mistakes count, and locked status
- `allPuzzles` array contains embedded puzzle definitions
- `currentIndex` tracks which puzzle is active

**Persistence Layer**
- Uses LocalStorage with prefix `connections.v2.` to save progress per puzzle
- Each puzzle saved by its `id` property
- `saveSilently()` stores state after every meaningful action
- `restoreIfAny()` loads saved state when loading a puzzle
- Progress persists across browser sessions

**Game Logic Flow**
1. Player selects 4 words from shuffled grid
2. On submit, check if selection matches any group exactly
3. If correct: remove words from board, add to "found" list, check for completion
4. If incorrect: increment mistakes, log attempt
5. After 4 mistakes or solving all 4 groups: lock puzzle and reveal solution

**Data Model**
Puzzles follow this structure:
```javascript
{
  id: 'p1',  // Unique identifier for LocalStorage
  groups: [  // Always exactly 4 groups
    {
      category: 'PRIMARY COLORS',  // Display name
      color: 'green',              // Visual theme (purple/blue/green/yellow)
      words: ['RED','BLUE','YELLOW','GREEN']  // Always 4 words, uppercase
    },
    // ... 3 more groups
  ]
}
```

### UI Components

**Board States**
- Active play: 4x4 grid of clickable word cards
- Locked (finished): Vertical stack showing all 4 groups with categories and color-coded borders

**Action Bar** (lines 74-80)
- Fixed to bottom with safe-area-inset for mobile notches
- Three buttons: Submit (check selection), Deselect (clear selection), Shuffle (randomize order)
- Buttons disabled when puzzle is locked

**Selection Logic**
- Maximum 4 words can be selected at once
- Selected cards get visual highlight (outline, background change, slight lift)
- Selection state tracked in `state.selection` Set

### CSS Architecture

**Design System** (`:root` variables, line 9)
- Dark theme with custom properties for colors
- Semantic naming: `--bg`, `--panel`, `--text`, `--accent`, etc.
- Consistent shadows and border radius throughout

**Responsive Design**
- Mobile-first approach with `clamp()` for fluid typography
- Grid adjusts: 4 columns on desktop, 3 on mobile (< 520px)
- Touch-friendly 44px+ minimum tap targets
- Safe area insets for notched devices

## Adding New Puzzles

To add puzzles, append objects to the `SAMPLES` array (lines 144-193):

```javascript
const SAMPLES = [
  // existing puzzles...
  {
    id: 'p9',  // Must be unique
    groups: [
      {category:'YOUR CATEGORY', color:'green', words:['WORD1','WORD2','WORD3','WORD4']},
      // ... 3 more groups with colors: purple/blue/green/yellow
    ]
  }
];
```

**Rules for puzzle data:**
- Each puzzle must have exactly 4 groups
- Each group must have exactly 4 words
- Words are automatically normalized to uppercase
- Colors map to hardcoded palette: purple → #9c27b0, blue → #4da3ff, green → #4caf50, yellow → #ffca28

## Common Modifications

**Changing difficulty/mistakes allowed**
- Modify `MAX_MISTAKES` constant (line 93)
- Update UI text in HTML (line 68) to match

**Styling adjustments**
- All colors defined in `:root` CSS variables (line 9)
- Border radius controlled by `--radius` (default 16px)
- Card sizing in `.card` class (line 22)

**Adding hints or help system**
- Would require new button in `.controls` (lines 45-49)
- Implement hint logic in JavaScript (e.g., reveal one correct word)
- Track hint usage in `state` object and persist to LocalStorage

## Testing Approach

Manual testing checklist:
- Test on mobile viewport (< 520px) for responsive layout
- Verify LocalStorage persistence (solve partially, refresh, check state restored)
- Test all three end states: solved (4 groups found), failed (4 mistakes), and mid-progress
- Check keyboard shortcuts: Enter to submit, Escape to deselect (line 197)
- Test edge cases: clicking locked puzzle, selecting > 4 words, rapid clicks

## LocalStorage Schema

Each puzzle saved as:
```
Key: "connections.v2.p1"
Value: {
  data: {puzzle object},
  id: "p1",
  order: [shuffled indices],
  selection: [selected indices],
  found: [completed groups],
  mistakes: 0-4,
  mistakesLog: [{ts, words}...],
  locked: boolean
}
```

To clear all progress: `localStorage.clear()` or remove items with prefix `connections.v2.`
