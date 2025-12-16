# KROG Chess

A feature-rich multiplayer chess application with KROG (Knowledge Representation of Games) move explanations, educational content, and polished UI/UX.

## Features

### Core Gameplay
- **Multiplayer Chess** - Real-time games via WebSocket
- **Room System** - Create/join games with 6-character room codes
- **Chess Clocks** - Bullet (1+0), Blitz (3+2), Rapid (10+0), or unlimited
- **Full Rules Support** - Castling, en passant, promotion, stalemate, threefold repetition, 50-move rule
- **Draw & Resign** - Offer draws, resign with confirmation
- **Rematch** - Quick rematch with automatic color swap

### KROG Engine
- **Move Explanations** - Every move explained with formal KROG notation
- **Illegal Move Feedback** - Learn why moves are invalid
- **FIDE References** - Links to official chess rules
- **Bilingual Support** - English and Norwegian explanations
- **T-Type Classification** - Categorizes moves by rule type (discretionary, conditional, mandatory)

### Educational Content
- **Puzzle Mode** - 30+ tactical puzzles with difficulty ratings
- **Opening Explorer** - Browse 10 major chess openings with move trees
- **Lessons** - 19 interactive lessons across 3 skill levels with quizzes
- **Learn Mode** - Hover over moves to see explanations before playing

### UI/UX
- **Board Themes** - 8 color schemes (Classic, Green, Blue, Purple, Gray, Wood, Ice, Tournament)
- **Sound Effects** - 11 distinct sounds for moves, captures, check, castling, and more
- **Move Suggestions** - Get ranked move recommendations with explanations
- **PGN Export** - Copy or download games in standard PGN format
- **Move History** - Review all moves in standard notation

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 19.2.0 |
| Frontend | TypeScript | 5.9.3 |
| Frontend | Vite | 7.2.4 |
| Backend | Express | 5.2.1 |
| Backend | Socket.IO | 4.8.1 |
| Chess Logic | chess.js | 1.4.0 |

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd chess-project

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Development

Start both server and client in separate terminals:

```bash
# Terminal 1: Start server
cd server
npm run dev
# Server runs on http://localhost:3000

# Terminal 2: Start client
cd client
npm run dev
# Client runs on http://localhost:5173
```

### Production Build

```bash
# Build client
cd client
npm run build

# Build server
cd server
npm run build

# Run production server
npm start
```

## Project Structure

```
chess-project/
├── client/                      # React frontend
│   ├── src/
│   │   ├── App.tsx              # Main application
│   │   ├── components/
│   │   │   ├── ChessBoard.tsx   # Board with themes
│   │   │   ├── PuzzleMode.tsx   # Tactical puzzles
│   │   │   ├── OpeningExplorer.tsx
│   │   │   └── LessonsMode.tsx
│   │   └── utils/
│   │       └── sounds.ts        # Web Audio API sounds
│   └── dist/                    # Production build
├── server/                      # Express backend
│   ├── src/
│   │   ├── index.ts             # Server & Socket.IO events
│   │   └── krog/                # KROG engine (12 modules)
│   ├── data/
│   │   ├── puzzles.json         # 30+ puzzles
│   │   ├── lessons.json         # 19 lessons
│   │   └── openings.json        # 10 openings
│   └── dist/                    # Production build
└── krog/                        # Specification documents
    └── PHASE1-7.md              # Detailed specs
```

## How to Play

1. Open http://localhost:5173 in your browser
2. Select a time control (Bullet, Blitz, Rapid, or Unlimited)
3. Click "Create New Game" to get a room code
4. Share the room code with a friend
5. Your friend enters the code and clicks "Join"
6. First player is White, second is Black
7. Play chess!

### Controls
- **Click** a piece to select it, then click destination
- **Drag and drop** pieces to move
- **Theme selector** - Change board colors
- **Sound toggle** - Enable/disable sound effects
- **Learn Mode** - Toggle to see move explanations on hover

## KROG Notation

KROG uses modal logic to formally describe chess rules:

- `P(move)` - Permitted (may make this move)
- `O(move)` - Obligated (must make this move)
- `F(move)` - Forbidden (cannot make this move)

Example:
```
P(Nf3) ↔ L_shape(g1, f3) ∧ ¬blocked(f3)
T-Type: T₁ (player discretion)
FIDE: Article 3.6
```

## License

ISC
