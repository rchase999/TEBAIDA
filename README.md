<p align="center">
  <img src="assets/icon.png" alt="DebateForge" width="120" />
</p>

<h1 align="center">DebateForge</h1>

<p align="center">
  <strong>AI-Powered Debate Arena — Watch AI Models Clash on Any Topic</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue" alt="Version" />
  <img src="https://img.shields.io/badge/electron-33.x-47848f" alt="Electron" />
  <img src="https://img.shields.io/badge/react-19.x-61dafb" alt="React" />
  <img src="https://img.shields.io/badge/typescript-5.x-3178c6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/tailwindcss-3.x-38bdf8" alt="Tailwind" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

<p align="center">
  Pit the world's most powerful AI models against each other in structured Oxford-style debates.<br/>
  Watch them argue, analyze their logic, and discover who makes the strongest case.
</p>

---

## Features

- **Multi-Model Arena** — Claude, GPT-4o, Gemini, Mistral, Groq, Ollama, and LM Studio
- **3 Debate Formats** — Oxford Union (10 turns), Lincoln-Douglas (8 turns), Parliamentary (8 turns)
- **Real-Time Streaming** — Watch AI responses stream in live with thinking indicators
- **Fallacy Detection** — Automatic identification of 20+ logical fallacies with severity levels
- **Evidence Verification** — Source credibility scoring across 65+ known domains
- **Momentum Tracking** — Real-time argument momentum analysis per turn
- **Custom Personas** — 8 built-in + unlimited custom debater personalities
- **ELO Rankings** — Competitive rating system tracking model performance
- **Tournament Mode** — Multi-debate bracket tournaments
- **Export & Share** — Export debates as JSON, share cards, and HTML reports
- **Dark Mode** — Intentionally designed dark theme, not just inverted colors
- **Keyboard Shortcuts** — Full keyboard navigation with Cmd+K command palette
- **i18n Ready** — English, Spanish, French, German, and Japanese

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Runtime | Electron 33 |
| Frontend | React 19 + TypeScript 5.7 |
| Styling | Tailwind CSS 3.4 |
| State Management | Zustand 5 |
| Database | better-sqlite3 (SQLite) |
| Icons | Lucide React |
| Build Tool | Vite 6 |
| AI Providers | Anthropic SDK, OpenAI SDK, Google Generative AI |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.x or later
- npm 10.x or later
- At least one AI provider API key (Anthropic, OpenAI, or Google)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/debateforge.git
cd debateforge

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Add your API keys to .env (or configure in-app Settings)
```

### Development

```bash
# Start development mode (Vite + TypeScript watcher + Electron)
npm run dev

# Or run individual processes
npm run dev:renderer    # Vite dev server (port 5173)
npm run dev:main        # TypeScript watch for Electron main process
npm start               # Launch Electron (after building)
```

### Building

```bash
# Build everything
npm run build

# Package for distribution
npm run package:win     # Windows (NSIS + Portable)
npm run package:mac     # macOS (DMG + ZIP)
npm run package:linux   # Linux (AppImage + DEB)
npm run package:all     # All platforms
```

## Project Structure

```
src/
├── main/                    # Electron main process
│   ├── main.ts             # App lifecycle, window, IPC handlers
│   ├── preload.ts          # Context bridge (secure IPC)
│   └── database.ts         # SQLite schema & initialization
├── core/                   # Core debate engines
│   ├── debate_engine/      # Debate orchestration & format definitions
│   ├── elo/                # ELO rating system
│   ├── fallacy_detector/   # 20+ fallacy pattern matching
│   ├── evidence_verifier/  # Source credibility scoring
│   ├── momentum/           # Real-time momentum calculation
│   ├── highlights/         # Key argument extraction
│   └── persona_manager/    # Persona I/O & management
├── services/               # AI provider API wrappers
│   ├── model-router.ts     # Multi-provider dispatch
│   ├── anthropic.ts        # Claude (extended thinking support)
│   ├── openai.ts           # GPT-4o, o1, o3
│   ├── google.ts           # Gemini 2.5
│   ├── ollama.ts           # Local Ollama
│   └── lmstudio.ts         # Local LM Studio
├── ui/                     # React frontend
│   ├── App.tsx             # Root component & routing
│   ├── store.ts            # Zustand state management
│   ├── components/         # 80+ reusable UI components
│   ├── views/              # Page-level components
│   ├── hooks/              # Custom React hooks
│   ├── themes/             # Light/dark theme tokens
│   └── i18n/               # Internationalization
├── utils/                  # Shared utilities
└── types.ts                # TypeScript type definitions
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development mode (all processes) |
| `npm run build` | Build renderer and main process |
| `npm run start` | Launch Electron (production build) |
| `npm run package:win` | Package for Windows |
| `npm run package:mac` | Package for macOS |
| `npm run package:linux` | Package for Linux |
| `npm test` | Run tests with Vitest |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Command palette |
| `Cmd/Ctrl + N` | New debate |
| `Cmd/Ctrl + D` | Toggle dark mode |
| `Cmd/Ctrl + E` | Export debates |
| `Cmd/Ctrl + /` | Toggle sidebar |
| `?` | Keyboard shortcuts reference |
| `Cmd/Ctrl + 1-9` | Navigate to views |

## Architecture

DebateForge uses a multi-process architecture:

- **Main Process** — Electron window management, SQLite database, IPC handlers, secure config storage
- **Renderer Process** — React SPA with Zustand state, AI provider API calls, real-time streaming UI
- **Preload Script** — Secure context bridge between main and renderer

AI debates follow a structured turn sequence where each model generates responses via streaming, with real-time analysis (fallacy detection, evidence verification, momentum tracking) applied to each turn.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ and too many API calls
</p>
