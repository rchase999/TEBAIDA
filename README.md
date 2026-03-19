# 🎙️ DebateForge

**AI-Powered Debate Arena — Watch AI Models Clash on Any Topic**

DebateForge is a desktop application that orchestrates structured, evidence-backed debates between AI models. Mix and match local and cloud-hosted models, assign custom personas with unique rhetorical styles, and watch them go head-to-head on any topic you choose — complete with live source verification.

Built with WiX Toolset for Windows distribution.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Debate Framework](#debate-framework)
- [Persona System](#persona-system)
- [Evidence & Source Verification](#evidence--source-verification)
- [Supported Models](#supported-models)
- [Architecture](#architecture)
- [Installation](#installation)
- [Building from Source](#building-from-source)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

DebateForge brings the rigor of competitive debate to AI. Instead of chatting with a single model, you set up a structured debate between two or more AI participants — each powered by a different (or the same) model, each embodying a distinct persona with its own worldview, argumentation style, and rhetorical strategy.

Every claim must be backed by evidence. When a debater cites a source, DebateForge opens a built-in browser panel, navigates to the page, scrolls to the exact passage, and highlights it — so you can verify the argument in real time.

The UI is designed to feel as polished and intuitive as the interfaces you already know from Claude, ChatGPT, and Gemini.

---

## Key Features

### 🤖 Multi-Model Debate Engine
- Pit any combination of AI models against each other — cloud vs. local, large vs. small, OpenAI vs. Anthropic vs. open-source.
- Run same-model debates with different personas to explore how framing shapes argumentation.
- Support for 2-player head-to-head, panel debates (3+), and round-robin tournament formats.

### 🎭 Custom Persona System
- Create detailed personas that define a debater's identity: background, expertise, rhetorical style, ideological leanings, and argumentation preferences.
- Personas are model-agnostic — the same persona definition works whether it's running on GPT-4, Claude, Llama, Mistral, or any other supported model.
- Comes with a library of pre-built personas (e.g., "Constitutional Originalist," "Utilitarian Philosopher," "Devil's Advocate," "Data-Driven Skeptic").

### 🔄 Universal Memory Import/Export
Inspired by Claude's project and memory features, DebateForge includes a portable persona memory system:

- **Export**: Any persona can export its accumulated knowledge about the user's preferences, debate history, and interaction patterns into a **Universal Persona Prompt (UPP)** — a structured, plain-language document designed to be understood by any model, including the smallest and least capable ones.
- **Import**: Load a UPP into any persona on any model. The prompt is written in clear, explicit natural language (no model-specific tokens or formatting tricks) so that even a 1B-parameter local model can parse and act on it.
- **Portability**: UPP files are human-readable `.json` documents. You can edit them by hand, share them, or version-control them.
- **Privacy**: All memory data stays local. Nothing is sent to any server unless you explicitly configure a cloud model to receive it.

### 📰 Live Evidence & Source Verification
When a debater makes a factual claim and cites a source:

1. A **built-in browser panel** opens alongside the debate view.
2. The browser navigates to the cited URL.
3. The page **auto-scrolls to the relevant passage** and highlights it.
4. The debater provides a **spoken/written explanation** of why this evidence supports their argument and how it connects to the broader point.
5. The opposing debater can challenge the source's credibility, relevance, or interpretation.

This ensures that debates stay grounded in verifiable information rather than hallucinated citations.

### 🎨 Modern, Polished UI
- Clean, minimal interface inspired by the design language of Claude, ChatGPT, and Gemini.
- Dark and light mode with smooth transitions.
- Split-pane layout: debate transcript on one side, evidence browser on the other.
- Real-time streaming of debate responses with typing indicators.
- Responsive layout that works on any screen size.
- Keyboard shortcuts for power users.

---

## How It Works

```
┌─────────────────────────────────────────────────────┐
│                    DebateForge                       │
│                                                     │
│  ┌─────────┐    ┌──────────────┐    ┌───────────┐  │
│  │  User    │───▶│ Debate       │───▶│ Model     │  │
│  │  Config  │    │ Orchestrator │    │ Router    │  │
│  └─────────┘    └──────────────┘    └───────────┘  │
│                        │                  │         │
│                        ▼                  ▼         │
│                 ┌──────────────┐   ┌────────────┐  │
│                 │ Debate       │   │ Local /    │  │
│                 │ Framework    │   │ Cloud APIs │  │
│                 │ Engine       │   └────────────┘  │
│                 └──────────────┘                    │
│                        │                            │
│                        ▼                            │
│            ┌───────────────────────┐                │
│            │ Evidence Verification │                │
│            │ (Embedded Browser)    │                │
│            └───────────────────────┘                │
└─────────────────────────────────────────────────────┘
```

1. **Choose a topic** — Enter any debate topic, from "Should AI be regulated?" to "Is pineapple acceptable on pizza?"
2. **Select debaters** — Pick models and assign personas to each side.
3. **Set the format** — Choose a debate structure (Lincoln-Douglas, Parliamentary, Oxford-style, free-form, etc.).
4. **Watch the debate unfold** — Models take turns presenting arguments, cross-examining, and rebutting — all in real time.
5. **Verify evidence** — Click any citation to open it in the evidence panel and see the source in context.
6. **Judge the outcome** — Use the built-in scoring rubric, or let a separate AI model act as judge.

---

## Debate Framework

DebateForge uses industry-proven debate methodologies adapted for AI:

### Supported Formats

| Format | Description | Rounds |
|---|---|---|
| **Lincoln-Douglas** | One-on-one values debate with constructive, cross-exam, and rebuttal phases | 6 |
| **Parliamentary** | Two teams, proposing and opposing a motion with points of information | 8 |
| **Oxford-Style** | Formal motion debate with audience (user) polling before and after | 4 |
| **Cross-Examination (Policy)** | Evidence-heavy format with dedicated cross-exam periods | 8 |
| **Socratic** | Question-driven dialogue aimed at uncovering contradictions | Flexible |
| **Free-Form** | Unstructured back-and-forth, closest to a natural argument | Flexible |

### Argumentation Standards

Each debater is prompted to follow structured argumentation principles:

- **Claim → Warrant → Impact**: Every argument must state a claim, provide reasoning (warrant), and explain why it matters (impact).
- **Source Obligation**: Factual claims must include a citation. Unsourced claims are flagged.
- **Rebuttal Requirement**: Debaters must directly address opposing arguments, not just present their own.
- **Logical Fallacy Detection**: An optional background monitor flags common fallacies (straw man, ad hominem, false dichotomy, etc.) in real time.
- **Steel-Manning**: Debaters are prompted to represent the strongest version of the opposing argument before countering it.

---

## Persona System

### Creating a Persona

Personas are defined in a structured `.json` file:

```json
{
  "name": "Dr. Empirica",
  "tagline": "If you can't measure it, it doesn't matter.",
  "background": "Research scientist with 20 years in evidence-based policy. Deeply skeptical of anecdotal reasoning.",
  "expertise": ["statistics", "public health", "economics", "research methodology"],
  "rhetorical_style": "Socratic, data-driven, calm but persistent. Favors meta-analyses over individual studies.",
  "ideological_leanings": "Pragmatic centrist. Follows the data wherever it leads.",
  "argumentation_preferences": {
    "evidence_weight": "heavy",
    "emotional_appeals": "minimal",
    "concession_willingness": "high",
    "humor": "dry, occasional"
  },
  "debate_behavior": {
    "opening_strategy": "Define terms precisely, establish burden of proof",
    "rebuttal_strategy": "Attack methodology and sample sizes of opposing evidence",
    "closing_strategy": "Summarize with a clear cost-benefit framework"
  }
}
```

### Universal Persona Prompt (UPP) — Memory Export/Import

The UPP system allows any persona to carry learned context across models and sessions:

```json
{
  "upp_version": "1.0",
  "generated_at": "2026-03-16T14:30:00Z",
  "user_profile": {
    "preferred_topics": ["AI ethics", "climate policy", "education reform"],
    "expertise_level": "intermediate — understands core arguments but appreciates detailed explanations",
    "debate_preferences": "prefers evidence-heavy formats, dislikes purely emotional appeals",
    "interaction_style": "asks probing follow-up questions, values concise responses"
  },
  "persona_state": {
    "name": "Dr. Empirica",
    "accumulated_positions": [
      "Has argued in favor of carbon taxation based on Nordhaus models",
      "Conceded that GDP is an incomplete measure of societal wellbeing"
    ],
    "user_relationship_notes": "User frequently challenges statistical methodology — prepare robust sourcing"
  },
  "instructions_for_any_model": "You are Dr. Empirica. You are a calm, data-driven debater who insists on empirical evidence for every claim. You prefer meta-analyses and systematic reviews over individual studies. You are willing to concede points when the evidence is against you. The user you are interacting with has intermediate knowledge and prefers evidence-heavy discussion. They will challenge your sources, so be thorough."
}
```

The `instructions_for_any_model` field is the core portability feature — it's written in plain, unambiguous natural language that any model can interpret, from GPT-4o to a quantized 3B local model.

---

## Evidence & Source Verification

### How Citation Verification Works

```
Debater says:
"According to a 2024 Nature study, global average temperatures
rose 1.2°C above pre-industrial levels..."

           │
           ▼

┌─────────────────────────────────────┐
│  EVIDENCE PANEL                     │
│  ┌───────────────────────────────┐  │
│  │ 🌐 nature.com/articles/...   │  │
│  │                               │  │
│  │  ...                          │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ ██ HIGHLIGHTED PASSAGE ██│  │  │
│  │  │ "The global mean surface │  │  │
│  │  │  temperature increased   │  │  │
│  │  │  by 1.2°C relative to..." │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  💬 DEBATER EXPLANATION:            │
│  "This passage confirms that the    │
│   warming threshold I cited is      │
│   supported by peer-reviewed data.  │
│   Note that this is a Nature        │
│   publication — impact factor 69.5  │
│   — which speaks to the rigor of    │
│   the methodology..."               │
└─────────────────────────────────────┘
```

### Verification Features

- **Auto-scroll & highlight**: The embedded browser finds and highlights the cited passage on the page.
- **Source credibility scoring**: Automatically evaluates source type (peer-reviewed journal, government report, news outlet, blog, social media) and displays a credibility indicator.
- **Dead link handling**: If a URL is unreachable, the debater is prompted to provide an alternative source or retract the claim.
- **Screenshot archival**: Evidence screenshots are saved locally so debates remain verifiable even if pages change.

---

## Supported Models

### Cloud Models

| Provider | Models | API Key Required |
|---|---|---|
| **Anthropic** | Claude Opus 4.6, Sonnet 4.6, Haiku 4.5 | Yes |
| **OpenAI** | GPT-4o, GPT-4o-mini, o1, o3 | Yes |
| **Google** | Gemini 2.5 Pro, Gemini 2.5 Flash | Yes |
| **Mistral** | Mistral Large, Mistral Medium | Yes |
| **Groq** | Llama, Mixtral (fast inference) | Yes |

### Local Models (via Ollama / LM Studio / llama.cpp)

| Model | Min. VRAM | Recommended For |
|---|---|---|
| Llama 3.x (8B) | 6 GB | Fast, general-purpose debating |
| Mistral 7B | 6 GB | Balanced reasoning and speed |
| Mixtral 8x7B | 24 GB | Strong multi-topic performance |
| Qwen 2.5 (7B/14B/72B) | 6–48 GB | Multilingual debates |
| Phi-3 (3.8B) | 4 GB | Lightweight, good for UPP testing |
| DeepSeek-R1 | 16+ GB | Strong reasoning and evidence chains |

Any model accessible via an OpenAI-compatible API endpoint is supported.

---

## Architecture

```
DebateForge/
├── src/
│   ├── core/
│   │   ├── debate_engine/          # Orchestrates turn-taking, timers, format rules
│   │   ├── model_router/           # Routes requests to local or cloud models
│   │   ├── persona_manager/        # Loads, saves, and applies persona definitions
│   │   ├── upp_engine/             # Universal Persona Prompt generation and parsing
│   │   ├── evidence_verifier/      # URL fetching, passage matching, highlighting
│   │   └── fallacy_detector/       # Real-time logical fallacy detection
│   ├── ui/
│   │   ├── components/             # Reusable UI components
│   │   ├── views/
│   │   │   ├── DebateView/         # Main debate transcript + controls
│   │   │   ├── EvidencePanel/      # Embedded browser for source verification
│   │   │   ├── PersonaEditor/      # Create and edit personas
│   │   │   ├── SetupWizard/        # Topic, model, format selection
│   │   │   └── TournamentView/     # Multi-round tournament bracket
│   │   ├── themes/                 # Light/dark theme definitions
│   │   └── App.tsx                 # Root application component
│   ├── services/
│   │   ├── anthropic.ts            # Anthropic API integration
│   │   ├── openai.ts               # OpenAI API integration
│   │   ├── google.ts               # Google Gemini integration
│   │   ├── ollama.ts               # Local model integration via Ollama
│   │   └── lmstudio.ts             # Local model integration via LM Studio
│   └── utils/
│       ├── prompt_builder.ts       # Constructs debate prompts per format and persona
│       ├── citation_parser.ts      # Extracts and validates citations from responses
│       └── scoring.ts              # Debate scoring and judging logic
├── personas/                       # Pre-built persona library
├── installer/
│   ├── Product.wxs                 # WiX installer definition
│   ├── UI.wxs                      # Custom installer UI
│   └── Bundle.wxs                  # Burn bootstrapper for prerequisites
├── assets/                         # Icons, fonts, images
├── docs/                           # Extended documentation
├── tests/                          # Unit and integration tests
├── README.md
├── LICENSE
└── package.json
```

### Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | Electron + React + TypeScript |
| **Styling** | Tailwind CSS |
| **Embedded Browser** | Electron BrowserView / WebContents |
| **Local Model Runtime** | Ollama / LM Studio / llama.cpp (user's choice) |
| **Cloud API Clients** | Anthropic SDK, OpenAI SDK, Google AI SDK |
| **State Management** | Zustand |
| **Debate Logging** | SQLite (local) |
| **Installer** | WiX Toolset v4+ |
| **Build System** | Electron Builder + WiX |

---

## Installation

### From Installer (Recommended)

1. Download `DebateForge-Setup.exe` from the [Releases](https://github.com/your-username/debateforge/releases) page.
2. Run the installer — it will handle prerequisites (.NET Runtime, Electron dependencies).
3. Launch DebateForge from the Start Menu or Desktop shortcut.

### System Requirements

| Component | Minimum | Recommended |
|---|---|---|
| **OS** | Windows 10 (64-bit) | Windows 11 |
| **RAM** | 4 GB | 16 GB (32 GB for large local models) |
| **Storage** | 500 MB (app only) | 20+ GB (with local models) |
| **GPU** | Not required for cloud-only | NVIDIA GPU with 6+ GB VRAM for local models |
| **Internet** | Required for cloud models | Required for evidence verification |

---

## Building from Source

### Prerequisites

- Node.js 20+
- npm or yarn
- .NET SDK 8.0+ (for WiX Toolset)
- WiX Toolset v4+ (`dotnet tool install --global wix`)
- Visual Studio 2022+ (optional, for WiX VS integration)

### Steps

```bash
# Clone the repository
git clone https://github.com/your-username/debateforge.git
cd debateforge

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the Electron app
npm run build

# Build the WiX installer
cd installer
wix build Product.wxs -o ../dist/DebateForge-Setup.msi

# Or build a bootstrapper bundle (includes prerequisites)
wix build Bundle.wxs -o ../dist/DebateForge-Setup.exe
```

---

## Configuration

### API Keys

On first launch, DebateForge will prompt you to enter API keys for the cloud providers you want to use. Keys are stored locally in an encrypted configuration file.

You can also set them via environment variables:

```
DEBATEFORGE_ANTHROPIC_KEY=sk-ant-...
DEBATEFORGE_OPENAI_KEY=sk-...
DEBATEFORGE_GOOGLE_KEY=AI...
```

### Local Model Setup

1. Install [Ollama](https://ollama.com) or [LM Studio](https://lmstudio.ai).
2. Pull a model (e.g., `ollama pull llama3.1`).
3. In DebateForge settings, point to your local endpoint (default: `http://localhost:11434`).

---

## Usage Guide

### Quick Start: Your First Debate

1. **Launch** DebateForge.
2. **Click** "New Debate."
3. **Enter a topic**: e.g., *"Should universal basic income replace existing welfare programs?"*
4. **Configure Debater A**: Select Claude Sonnet 4.6, assign the "Policy Wonk" persona, position: FOR.
5. **Configure Debater B**: Select Llama 3.1 (local), assign the "Fiscal Conservative" persona, position: AGAINST.
6. **Choose format**: Oxford-Style (4 rounds).
7. **Click** "Start Debate" and watch them go.

### Importing/Exporting Persona Memory

**Export:**
1. Open a persona's settings.
2. Click "Export Memory (UPP)."
3. Save the `.json` file anywhere.

**Import:**
1. Open any persona's settings (can be on a different model).
2. Click "Import Memory (UPP)."
3. Select the `.json` file.
4. The persona now has full context about your preferences and past interactions.

---

## Roadmap

- [x] Core debate engine with turn management
- [x] Cloud model integration (Anthropic, OpenAI, Google)
- [x] Local model support via Ollama
- [x] Custom persona system
- [x] Evidence browser panel with auto-scroll
- [x] True multi-agent debate — each debater uses its own model with distinct routing
- [x] Configurable Housemaster — choose model and persona for the moderator
- [x] Agent transition indicators — clear visual handoff between debaters
- [x] Model diversity warnings — hints when all debaters use the same model
- [x] Debate transcript export — download or copy as Markdown
- [x] Auto-scoring with breakdown — argumentation, evidence, rebuttal, rhetoric
- [x] Logical fallacy detection overlay
- [x] Post-debate opinion shift tracking
- [x] Enhanced debate history with matchup display
- [x] Universal Persona Prompt (UPP) v1.0 — export/import cross-model persona prompts
- [x] Tournament mode — functional brackets with single-elimination & round-robin
- [x] Voice synthesis — TTS with per-debater voice assignment (Web Speech API)
- [x] Keyboard shortcuts — Space (pause), Enter (continue), Escape (stop), V (voice)
- [x] Audience mode — live voting panel with For/Against/Undecided tallying
- [x] Multilingual debate support — 12 languages with prompt-level enforcement
- [x] Custom debate formats — Lincoln-Douglas (1v1) and Parliamentary added
- [x] Statistics dashboard — comprehensive analytics with model usage, fallacy stats, win rates
- [x] Quick rematch — one-click restart with swapped sides
- [x] Debate search — full-text search across all debates, models, personas, and content
- [x] Turn timer — live elapsed time display during generation
- [x] Auto-topic generator — 18 curated topics with random selection
- [x] Format selection — choose Oxford Union, Lincoln-Douglas, or Parliamentary in setup
- [x] Linux and macOS builds — electron-builder targets for DMG, AppImage, deb
- [x] Debate bookmarks — save and navigate to key moments
- [x] Notification sounds — audio cues for turn completion, agent switch, debate end
- [x] Multi-format engine fix — engine now uses each format's own turn sequence
- [x] Comprehensive test suite — 161 tests across 13 files

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) before submitting a PR.

Key areas where help is needed:
- Additional debate format templates
- Pre-built persona library expansion
- Local model performance optimization
- Accessibility improvements
- Internationalization (i18n)

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>DebateForge</strong> — Because the best way to find the truth is to argue about it.
</p>
