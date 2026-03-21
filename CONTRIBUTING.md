# Contributing to DebateForge

Thank you for your interest in contributing to DebateForge! This guide will help you get started.

## Development Environment Setup

1. **Prerequisites**
   - Node.js >= 18.x
   - npm >= 9.x
   - Git

2. **Clone and install**
   ```bash
   git clone https://github.com/your-username/debateforge.git
   cd debateforge
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Code Style

- **TypeScript** — All source code is written in TypeScript with strict mode enabled. Avoid using `any`; prefer explicit types and interfaces.
- **React** — Use functional components with hooks. Keep components small and focused. Co-locate related files when possible.
- **Tailwind CSS** — Use Tailwind utility classes for styling. Avoid writing custom CSS unless absolutely necessary. Follow the project's design system tokens.
- **Formatting** — The project uses Prettier for automatic formatting. Run `npm run format` before committing, or configure your editor to format on save. Run `npm run format:check` to verify.
- **Linting** — Run `npm run lint` to check for issues. All lint errors must be resolved before submitting a PR.

## Pull Request Process

1. **Fork** the repository and create your branch from `master`.
2. **Branch naming** — Use descriptive branch names:
   - `feat/add-new-debate-format`
   - `fix/fallacy-detection-edge-case`
   - `docs/update-contributing-guide`
3. **Make your changes** — Write clear, well-tested code. Add or update tests as needed.
4. **Run checks** — Ensure all of the following pass before opening a PR:
   ```bash
   npm run typecheck
   npm run lint
   npm run format:check
   npm test
   ```
5. **Open a Pull Request** — Provide a clear title and description of what your PR does and why. Reference any related issues.
6. **Code review** — A maintainer will review your PR. Be responsive to feedback and make requested changes promptly.

## Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short summary>

<optional body>

<optional footer>
```

**Types:**
- `feat` — A new feature
- `fix` — A bug fix
- `docs` — Documentation changes
- `style` — Code style changes (formatting, semicolons, etc.)
- `refactor` — Code refactoring without feature or bug changes
- `test` — Adding or updating tests
- `chore` — Build process, dependency updates, tooling

**Examples:**
```
feat(arena): add round-robin tournament mode
fix(fallacy): correct false positive in ad hominem detection
docs(readme): update installation instructions
```

## Reporting Bugs

Please report bugs by [opening an issue](https://github.com/your-username/debateforge/issues/new) on GitHub. Include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Your environment (OS, Node.js version, app version)
- Screenshots or logs if applicable

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.
