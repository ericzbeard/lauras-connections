# 🎄 Laura's Connections - A Christmas Gift

A custom Connections-style puzzle game created as a Christmas gift for Laura. This is a browser-based word puzzle game inspired by the New York Times Connections, featuring 8 hand-crafted puzzles.

## 🎁 About This Gift

This is a personal Christmas present - a collection of word puzzle games where you find groups of four words that share a common connection. Each puzzle has four groups of four words, and the challenge is to identify all the groups with a maximum of 4 mistakes allowed.

## ✨ Features

- **Welcome Screen**: Christmas-themed intro with a festive emoji tree
- **8 Custom Puzzles**: Hand-crafted word puzzles across various categories
- **Progress Tracking**: Your progress is automatically saved in your browser
- **Results Sharing**: Copy your results as colorful emoji grids to share
- **Hints**: "One away..." notification when you're close (3 out of 4 correct)
- **Mobile Friendly**: Responsive design works great on phones and tablets
- **Dark Theme**: Easy on the eyes with a sophisticated dark color scheme

## 🎮 How to Play

1. Open `index.html` in your web browser
2. Click "🎄 Start Puzzles" on the welcome screen
3. Select a puzzle from the grid
4. Click 4 words that you think belong together
5. Click "✅ Submit" to check your guess
6. Find all 4 groups to solve the puzzle!
7. You have 4 mistakes before the puzzle is revealed

### Game Controls

- **Submit**: Check if your selected 4 words form a group
- **Deselect**: Clear your current selection
- **Shuffle**: Randomize the word order for a fresh perspective
- **Reset**: Start the current puzzle over from scratch
- **Show Results**: View your solving pattern as colored emoji blocks

## 🎨 Color System

Each group has a difficulty level indicated by color:
- 🟨 **Yellow**: Straightforward
- 🟩 **Green**: Moderate
- 🟦 **Blue**: Tricky
- 🟪 **Purple**: Challenging

## 📂 Project Structure

```
Connections/
├── index.html          # Main game interface
├── game.js             # Game logic and state management
├── test.html           # Unit test suite
├── CLAUDE.md          # Development documentation
└── README.md          # This file
```

## 🛠️ Technical Details

- **Pure Vanilla JavaScript**: No frameworks or dependencies
- **LocalStorage**: Progress automatically saved in the browser
- **Responsive Design**: CSS Grid and Flexbox for flexible layouts
- **JSDoc Comments**: All functions are documented for maintainability
- **Unit Tests**: Custom test harness for quality assurance

## 💾 Data Persistence

Your progress is saved automatically:
- Each puzzle tracks: solved groups, mistakes, guesses, and completion status
- Data persists across browser sessions using localStorage
- Each puzzle maintains independent state
- Click "Reset" to start a puzzle over

## 🧪 Testing

A custom test suite is included to ensure everything works correctly:

1. Open `test.html` in your browser
2. Tests run automatically on page load
3. Validates game logic, utilities, and puzzle data integrity

## 🎯 Puzzle Status Icons

- ⬜ **Unsolved**: Haven't started or in progress
- ✅ **Solved**: Successfully completed
- ✖️ **Failed**: Reached 4 mistakes

## 🔄 Navigation

- Click the **logo** at the top to return to the welcome screen anytime
- Use **📋 Puzzles** button to go back to the puzzle selector
- Click **📊 Show Results** after completing a puzzle to see your solving pattern

## 💝 Special Features

### Christmas Welcome
The intro screen features a handcrafted Christmas tree made of colored emoji blocks, complete with a yellow star on top and a brown trunk.

### Results Sharing
After solving (or failing) a puzzle, you can view your results as a colorful emoji grid showing which words you selected in each guess. Copy these results to share your solving journey!

### Smart Hints
The game provides helpful feedback:
- "One away..." when 3 out of 4 words are correct
- "Already tried that..." to prevent duplicate guesses
- Color-coded groups revealed progressively as you solve them

## 🎓 Credits

Created with love as a Christmas 2025 gift for Laura.

Built using:
- HTML5, CSS3, and JavaScript (ES6+)
- Emoji for visual elements (🟨🟩🟦🟪)
- LocalStorage API for persistence
- Custom test harness for reliability

## 📝 License

This is a personal gift project. Feel free to enjoy the puzzles! 🎄

---

**Merry Christmas, Laura! I hope you enjoy these puzzles!** 🎁
