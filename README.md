<p align="center">
<pre>
     ____       __          __       ______
    / __ \___  / /_  ____ _/ /____  / ____/___  _________ ____
   / / / / _ \/ __ \/ __ `/ __/ _ \/ /_  / __ \/ ___/ __ `/ _ \
  / /_/ /  __/ /_/ / /_/ / /_/  __/ __/ / /_/ / /  / /_/ /  __/
 /_____/\___/_.___/\__,_/\__/\___/_/    \____/_/   \__, /\___/
                                                   /____/
</pre>
</p>

<p align="center">
  <strong>AI-Powered Debate Arena -- Watch AI Models Clash on Any Topic</strong>
</p>

<p align="center">
  <a href="#getting-started"><img alt="Build: passing" src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square" /></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" /></a>
  <a href="package.json"><img alt="Version: 1.0.0" src="https://img.shields.io/badge/version-1.0.0-orange?style=flat-square" /></a>
  <img alt="Platform: Windows | macOS | Linux" src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square" />
  <img alt="Electron 33.4" src="https://img.shields.io/badge/Electron-33.4-47848f?style=flat-square&logo=electron&logoColor=white" />
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black" />
  <img alt="TypeScript 5.7" src="https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript&logoColor=white" />
</p>

---

**DebateForge** is a cross-platform desktop application that orchestrates structured, evidence-backed debates between AI models. Configure custom personas, select from cloud or local models, choose a formal debate format, and watch AI debaters engage in rigorous argumentation -- complete with real-time evidence verification, logical fallacy detection, and ELO-based rankings.

> Pit Claude against GPT-4o. Run a local Llama model against Gemini. Assign distinct personas, enforce formal debate rules, and let the arguments speak for themselves.

---

## Table of Contents

- [Key Features](#key-features)
- [Supported Models](#supported-models)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Debate Formats](#debate-formats)
- [Persona System](#persona-system)
- [Tech Stack](#tech-stack)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

### Debate Engine

- **Multi-model AI debates** -- pit any combination of cloud and local models against each other (Claude vs GPT vs Gemini vs Ollama vs LM Studio)
- **3 formal debate formats** -- Oxford Union (10 turns), Lincoln-Douglas (8 turns), Parliamentary (8 turns), each with distinct phase sequences
- **Streaming responses** with extended thinking support for models that provide chain-of-thought reasoning
- **Audience voting panel** -- live For / Against / Undecided tallying to track opinion shifts
- **Momentum tracking visualization** -- see which debater is gaining rhetorical ground turn by turn
- **Word count analytics** -- per-turn word badges and post-debate word statistics

### Analysis and Scoring

- **Real-time evidence verification** with source credibility scoring
- **Logical fallacy detection** -- identifies 14+ patterns including straw man, ad hominem, false dichotomy, appeal to authority, and more
- **ELO rating system** with a persistent model leaderboard tracking wins, losses, and performance over time
- **Tournament mode** -- single-elimination and round-robin brackets for multi-model competitions

### Persona System

- **8 built-in personas** with distinct rhetorical styles, expertise areas, and argumentation strategies
- **Unlimited custom personas** -- define background, ideology, debate behavior, evidence preferences, and more
- **Universal Persona Prompt (UPP)** -- export and import persona memory across models and sessions

### Productivity and Organization

- **Debate bookmarks** -- save and navigate to key moments in any debate
- **Tags and notes** -- organize debates with custom tags and attach free-form notes
- **Debate templates** -- save and load debate configurations as reusable presets with 10 quick-start topics
- **Import / export debates as JSON** for backup and sharing
- **Export to HTML** -- generate self-contained, shareable debate pages
- **Full-text search** across all debates, models, personas, and content

### User Experience

- **Voice synthesis** for debate playback with per-debater voice assignment (Web Speech API)
- **Debate replay** -- step-through playback with play / pause / skip controls
- **Speed control** -- adjustable delay slider for auto-run pacing
- **Dark / light / system theme** with smooth transitions
- **Command palette** (Cmd+K / Ctrl+K) for fast navigation
- **Keyboard shortcuts** throughout -- Space (pause), Enter (continue), Escape (stop), V (voice toggle)
- **Activity heatmap** and **debate word cloud** for visual analytics
- **12-language support** with prompt-level enforcement
- **Notification sounds** -- audio cues for turn completion, agent switch, and debate end
- **Konami code easter egg** -- because why not

### Platform

- **Cross-platform** -- Windows (NSIS installer + portable), macOS (DMG), Linux (AppImage + deb)
- **SQLite database** for fast, local-first data persistence
- **161 tests** across 13 test files

---

## Supported Models

### Cloud Providers

| Provider | Models | Requires API Key |
|---|---|---|
| **Anthropic** | Claude Opus, Sonnet, Haiku | Yes |
| **OpenAI** | GPT-4o, GPT-4o-mini, o1, o3 | Yes |
| **Google** | Gemini 2.5 Pro, Gemini 2.5 Flash | Yes |

### Local Models (via Ollama / LM Studio)

| Runtime | Default Endpoint | Setup |
|---|---|---|
| **Ollama** | `http://localhost:11434` | `ollama pull <model>` |
| **LM Studio** | `http://localhost:1234/v1` | Download model in LM Studio UI |

Any model accessible through an OpenAI-compatible API endpoint is supported. Run Llama, Mistral, Mixtral, Qwen, Phi, DeepSeek, or any other model you can serve locally.

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **npm** (included with Node.js)
- At least one AI provider: an API key for Anthropic / OpenAI / Google, **or** a local model runtime (Ollama / LM Studio)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/debateforge.git
cd debateforge

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Open .env and add your API keys (at least one provider is required)

# 4. Start in development mode
npm run dev
```

### Production Build

```bash
# Build the application
npm run build

# Run the built application
npm start
```

### Environment Variables

Copy `.env.example` to `.env` and configure at minimum one AI provider:

```env
# At least one API key is required
DEBATEFORGE_ANTHROPIC_KEY=sk-ant-...
DEBATEFORGE_OPENAI_KEY=sk-...
DEBATEFORGE_GOOGLE_KEY=AI...

# Local model endpoints (defaults shown)
DEBATEFORGE_OLLAMA_ENDPOINT=http://localhost:11434
DEBATEFORGE_LMSTUDIO_ENDPOINT=http://localhost:1234/v1

# App settings
DEBATEFORGE_THEME=system          # light | dark | system
DEBATEFORGE_STREAMING=true
DEBATEFORGE_FALLACY_DETECTION=true
DEBATEFORGE_LANGUAGE=en           # ISO 639-1 code
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development mode (Electron + Vite with hot reload) |
| `npm run build` | Build renderer (Vite) and main process (TypeScript) for production |
| `npm start` | Launch the built Electron application |
| `npm run package:win` | Package as Windows installer (NSIS + portable) |
| `npm run package:mac` | Package as macOS DMG |
| `npm run package:linux` | Package as Linux AppImage and deb |
| `npm run package:all` | Build for all platforms |
| `npm run lint` | Run ESLint across the source tree |
| `npm test` | Run the full Vitest test suite |

---

## Configuration

### API Keys

On first launch, navigate to **Settings** to enter API keys for the cloud providers you want to use. Alternatively, set them in your `.env` file before starting the application.

### Local Model Setup

1. Install [Ollama](https://ollama.com) or [LM Studio](https://lmstudio.ai).
2. Pull or download a model (e.g., `ollama pull llama3.1`).
3. Ensure the server is running -- DebateForge will auto-detect models at the configured endpoints.

### Themes

Switch between **dark**, **light**, and **system** themes from Settings or through the command palette (Cmd+K / Ctrl+K).

---

## Project Structure

```
debateforge/
├── src/
│   ├── core/                          # Core business logic engines
│   │   ├── debate_engine/             # Turn orchestration, format rules, phase sequencing
│   │   │   ├── index.ts               # Main debate engine
│   │   │   └── formats.ts             # Oxford Union, Lincoln-Douglas, Parliamentary definitions
│   │   ├── elo/                       # ELO rating calculations and leaderboard management
│   │   ├── evidence_verifier/         # Source credibility scoring and claim verification
│   │   ├── fallacy_detector/          # 14+ logical fallacy pattern recognition
│   │   ├── highlights/                # Debate highlight extraction
│   │   ├── model_router/              # Routes requests to the correct provider/endpoint
│   │   ├── momentum/                  # Debate momentum tracking and scoring
│   │   ├── persona_manager/           # Persona CRUD, built-in library, custom personas
│   │   └── upp_engine/                # Universal Persona Prompt generation and parsing
│   ├── main/                          # Electron main process
│   ├── services/                      # API provider integrations
│   │   ├── anthropic.ts               # Anthropic Claude SDK integration
│   │   ├── openai.ts                  # OpenAI SDK integration
│   │   ├── google.ts                  # Google Generative AI integration
│   │   ├── ollama.ts                  # Ollama local model client
│   │   ├── lmstudio.ts               # LM Studio local model client
│   │   └── model-router.ts           # Unified model routing service
│   ├── ui/                            # React frontend
│   │   ├── App.tsx                    # Root application component and routing
│   │   ├── store.ts                   # Zustand global state store
│   │   ├── main.tsx                   # React entry point
│   │   ├── index.css                  # Tailwind CSS entry and global styles
│   │   ├── components/                # 50+ reusable UI components
│   │   │   ├── CommandPalette.tsx     # Cmd+K command palette
│   │   │   ├── DebateBookmarks.tsx    # Bookmark management
│   │   │   ├── DebateReplay.tsx       # Step-through playback controls
│   │   │   ├── DebateWordCloud.tsx    # Word frequency visualization
│   │   │   ├── ExportHTML.tsx         # Self-contained HTML export
│   │   │   ├── MarkdownRenderer.tsx   # Rich markdown rendering for turns
│   │   │   ├── MomentumGraph.tsx      # Momentum tracking chart
│   │   │   ├── VoiceSynthesis.tsx     # Web Speech API TTS controls
│   │   │   └── ...                    # Additional components
│   │   ├── hooks/                     # Custom React hooks
│   │   │   └── useKeyboardShortcuts.ts
│   │   ├── themes/                    # Theme definitions (dark/light/system)
│   │   └── views/                     # Page-level view components
│   │       ├── DebateView/            # Main debate transcript and controls
│   │       ├── EvidencePanel/         # Source verification panel
│   │       ├── HomeView.tsx           # Dashboard with activity heatmap
│   │       ├── LeaderboardView/       # ELO rankings and model statistics
│   │       ├── PersonaEditor/         # Create and edit personas
│   │       ├── SetupWizard/           # New debate configuration wizard
│   │       ├── SettingsView.tsx       # API keys, preferences, theme selection
│   │       ├── StatisticsView.tsx     # Analytics dashboard
│   │       └── TournamentView/        # Tournament bracket management
│   ├── types.ts                       # Shared TypeScript type definitions
│   └── utils/                         # Utility modules
│       ├── prompt_builder.ts          # Constructs debate prompts per format and persona
│       ├── citation_parser.ts         # Extracts and validates citations from responses
│       └── scoring.ts                 # Debate scoring and judging logic
├── tests/                             # 13 test files, 161 tests
│   ├── debate_engine.test.ts
│   ├── debate_engine_formats.test.ts
│   ├── elo.test.ts
│   ├── evidence_verifier.test.ts
│   ├── fallacy_detector.test.ts
│   ├── persona_manager.test.ts
│   ├── scoring.test.ts
│   └── ...
├── personas/                          # Pre-built persona library (JSON)
├── assets/                            # App icons (ico, icns, png)
├── installer/                         # WiX installer definitions (Windows MSI)
├── docs/                              # Extended documentation
├── .env.example                       # Environment variable template
├── package.json
├── tsconfig.json                      # Renderer TypeScript config
├── tsconfig.main.json                 # Main process TypeScript config
├── vite.config.ts                     # Vite build configuration
├── tailwind.config.js                 # Tailwind CSS configuration
├── postcss.config.mjs                 # PostCSS configuration
└── LICENSE                            # MIT License
```

---

## Architecture Overview

DebateForge follows a layered architecture with clear separation between the core debate logic, API integrations, and the UI layer.

```
┌──────────────────────────────────────────────────────────────────┐
│                        RENDERER PROCESS                          │
│                                                                  │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│   │  Setup        │  │  Debate      │  │  Tournament /        │  │
│   │  Wizard       │  │  View        │  │  Leaderboard / Stats │  │
│   └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│          │                 │                      │              │
│          └─────────────────┼──────────────────────┘              │
│                            │                                     │
│                    ┌───────▼────────┐                            │
│                    │  Zustand Store  │                            │
│                    └───────┬────────┘                            │
│                            │                                     │
├────────────────────────────┼─────────────────────────────────────┤
│                     CORE ENGINES                                 │
│                            │                                     │
│   ┌────────────────────────▼────────────────────────────────┐   │
│   │                  Debate Engine                            │   │
│   │  Turn orchestration | Format rules | Phase sequencing    │   │
│   └──┬─────────┬──────────┬──────────┬──────────┬───────────┘   │
│      │         │          │          │          │               │
│      ▼         ▼          ▼          ▼          ▼               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐     │
│  │Persona │ │Evidence│ │Fallacy │ │  ELO   │ │Momentum  │     │
│  │Manager │ │Verifier│ │Detector│ │ System │ │ Tracker  │     │
│  └────────┘ └────────┘ └────────┘ └────────┘ └──────────┘     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                     MODEL ROUTER                                 │
│                                                                  │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ ┌────────┐ │
│   │ Anthropic│ │  OpenAI  │ │  Google  │ │Ollama │ │LM      │ │
│   │  (Claude)│ │(GPT/o1/o3│ │ (Gemini) │ │(local)│ │Studio  │ │
│   └──────────┘ └──────────┘ └──────────┘ └───────┘ └────────┘ │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                     DATA LAYER                                   │
│                                                                  │
│   ┌──────────────────┐  ┌──────────────────────────────────┐    │
│   │  SQLite (better-  │  │  Electron Store (settings,       │    │
│   │  sqlite3)         │  │  API keys, preferences)          │    │
│   └──────────────────┘  └──────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### Core Engines

| Engine | Responsibility |
|---|---|
| **Debate Engine** | Orchestrates turn-taking, enforces format-specific phase sequences (opening, cross-examination, rebuttal, closing), manages timers and debate state |
| **Model Router** | Resolves which provider and endpoint to call for each debater; handles streaming, retries, and extended thinking |
| **Persona Manager** | Loads built-in and custom persona definitions; injects persona context into prompts |
| **Evidence Verifier** | Scores source credibility, validates citations, flags unsupported claims |
| **Fallacy Detector** | Pattern-matches 14+ logical fallacies in real time and surfaces them in the UI |
| **ELO System** | Calculates rating changes after each debate; maintains a persistent leaderboard |
| **Momentum Tracker** | Computes per-turn momentum scores to visualize which debater is gaining ground |
| **UPP Engine** | Generates and parses Universal Persona Prompts for cross-model persona portability |

---

## Debate Formats

| Format | Turns | Structure |
|---|---|---|
| **Oxford Union** | 10 | Formal motion debate with opening statements, argument rounds, rebuttals, and closing statements. Includes audience polling. |
| **Lincoln-Douglas** | 8 | One-on-one values debate with constructive cases, cross-examination, and rebuttals. |
| **Parliamentary** | 8 | Government vs. Opposition with points of information, member speeches, and whip summaries. |

Each format defines its own turn sequence with labeled phases, ensuring debaters follow the structure appropriate to the format rather than free-form back-and-forth.

---

## Persona System

DebateForge ships with **8 built-in personas** covering a range of rhetorical styles, and supports unlimited custom personas.

### Built-in Personas

Personas are model-agnostic -- the same persona works whether assigned to Claude, GPT-4o, Gemini, or a local model. Each persona defines:

- **Background and expertise** -- who the debater is
- **Rhetorical style** -- how they argue (Socratic, data-driven, passionate, etc.)
- **Ideological leanings** -- what assumptions shape their worldview
- **Argumentation preferences** -- evidence weight, emotional appeals, concession willingness
- **Debate behavior** -- opening, rebuttal, and closing strategies

### Custom Personas

Create new personas through the **Persona Editor** in the application. Define every aspect of a debater's identity and argumentation approach.

### Universal Persona Prompt (UPP)

Export any persona's accumulated context as a portable JSON file that can be imported into any other model. The UPP is written in plain natural language so that even small local models can interpret it.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Desktop Runtime** | Electron | 33.4 |
| **UI Framework** | React | 19 |
| **Language** | TypeScript | 5.7 |
| **Build Tool** | Vite | 6 |
| **Styling** | Tailwind CSS | 3.4 |
| **State Management** | Zustand | 5 |
| **Database** | SQLite via better-sqlite3 | 11.7 |
| **Icons** | Lucide React | -- |
| **Routing** | React Router | 7.1 |
| **Testing** | Vitest | 2.1 |
| **Linting** | ESLint | 9 |
| **Packaging** | electron-builder | 25.1 |
| **AI SDKs** | @anthropic-ai/sdk, openai, @google/generative-ai | -- |

---

## Testing

The project includes **161 tests across 13 test files** covering all core engines and utilities:

```bash
# Run the full test suite
npm test

# Tests cover:
# - Debate engine turn orchestration
# - Format-specific phase sequencing
# - ELO rating calculations
# - Evidence verification and credibility scoring
# - Fallacy detection patterns
# - Persona management and loading
# - Momentum tracking
# - Citation parsing
# - Prompt construction
# - Scoring logic
# - UPP generation and parsing
# - Ollama think tag handling
```

---

## Contributing

Contributions are welcome. Here is how to get started:

1. **Fork** the repository and create a feature branch.
2. **Install** dependencies with `npm install`.
3. **Run** the development server with `npm run dev`.
4. **Write tests** for any new functionality.
5. **Ensure** all tests pass with `npm test` and linting passes with `npm run lint`.
6. **Submit** a pull request with a clear description of the change.

### Areas Where Contributions Are Especially Valuable

- Additional debate format templates
- Expanding the built-in persona library
- Performance optimization for local model integration
- Accessibility improvements (screen readers, keyboard navigation)
- Internationalization -- expanding beyond the current 12 languages
- New fallacy detection patterns
- UI/UX improvements and bug fixes

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for the full text.

---

<p align="center">
  <strong>DebateForge</strong> -- Because the best way to find the truth is to argue about it.
</p>
