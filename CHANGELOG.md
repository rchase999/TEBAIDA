# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-21

### Added

- **Multi-Model Arena** — Pit AI models against each other (OpenAI, Anthropic, Google Gemini) in structured debates on any topic.
- **Three Debate Formats** — Support for Oxford-style, Lincoln-Douglas, and Free-form debate structures.
- **Fallacy Detection** — Real-time identification of logical fallacies in AI-generated arguments with explanations and categorization.
- **Evidence Verification** — Automated fact-checking and source evaluation for claims made during debates.
- **Momentum Tracking** — Live scoring and momentum visualization showing which model is winning throughout the debate.
- **Custom Personas** — Create and assign custom personas to AI models to shape their argumentation style and perspective.
- **ELO Rankings** — Persistent ELO rating system to track model performance across debates over time.
- **Tournament Mode** — Round-robin and bracket-style tournaments for multi-model competitions.
- **Export and Share** — Export debate transcripts and results in multiple formats; share debates with others.
- **Dark Mode** — Full dark mode support with automatic system preference detection.
- **Internationalization (i18n)** — Multi-language support infrastructure for global accessibility.
- **Keyboard Shortcuts** — Comprehensive keyboard shortcut system for power users.
- **Command Palette** — Quick-access command palette for fast navigation and actions.
- **Smart Topic Suggestions** — Intelligent topic generation across five categories with auto-suggestions.
- **Debate Format Guide** — Built-in guide explaining each debate format's rules and structure.
- **12 Design System Components** — Complete component library including buttons, modals, tooltips, badges, tabs, cards, dropdowns, progress bars, toggles, alerts, avatars, and skeleton loaders.
- **Landing Page** — Polished landing page with feature highlights and quick-start flow.
- **User Profiles** — User profile management with debate history and statistics.
- **5 Application Views** — Dedicated views for arena, history, rankings, settings, and profiles.
- **Markdown Renderer** — Enhanced Markdown rendering for debate content with syntax highlighting.
- **Evidence Panel** — Dedicated panel for reviewing and comparing evidence cited during debates.

### Infrastructure

- **CI/CD Pipeline** — Automated build, test, and release workflows.
- **Docker Support** — Containerized development and deployment configuration.
- **Comprehensive README** — Detailed project documentation with setup instructions, architecture overview, and usage guide.
- **Electron Packaging** — Cross-platform desktop builds for Windows, macOS, and Linux.
- **Vite Build System** — Fast development server and optimized production builds.
- **Tailwind CSS** — Utility-first CSS framework with custom design tokens.
- **Zustand State Management** — Lightweight, performant global state management.
- **SQLite Database** — Local persistent storage via better-sqlite3.
- **ESLint Configuration** — Code quality enforcement with TypeScript-aware rules.
- **Prettier Configuration** — Consistent code formatting across the project.
- **Vitest Testing** — Fast unit and integration testing framework.
