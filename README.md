# Todo Cow

---

With Todo Cow, we're not just building a product; we're crafting a tool that empowers herdsmen, enhances animal care, and sets a new standard for simplicity and effectiveness in agricultural technology.

## Features

- Add a cow with a name and an ear tag number
- View, edit, and remove cows
- Add tasks to a cow with a title and due date
- Mark tasks done / not done
- Herd view listing every cow with its outstanding task count, sorted so overdue cows surface first

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS with shadcn/ui-style components
- **Database**: [Turso](https://turso.tech) (libSQL) via `@libsql/client`
- **ORM**: Drizzle ORM
- **Mutations**: Next.js Server Actions
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- A [Turso](https://turso.tech) database (or a local `file:local.db` for development, no external service required)
- [Claude Code CLI](https://claude.ai/claude-code) (for Ralph autonomous development)
- [GitHub CLI](https://cli.github.com/) (for Ralph issue integration)

### Installation

```bash
git clone <your-repo-url>
cd todo-cow
npm install
cp .env.example .env
```

Fill in `.env` with your Turso database URL and auth token. To develop without an external service, set `TURSO_DATABASE_URL=file:local.db` and leave `TURSO_AUTH_TOKEN` unset.

### Database Setup

Push the schema (creates the `cows` and `tasks` tables):

```bash
npm run db:push
```

If you prefer versioned migration files instead of a direct push, use `npm run db:generate` to write SQL into `./drizzle`, then `npm run db:migrate` to apply it.

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Tests

```bash
npm test
```

## Deploying to Vercel

1. Create a Turso database and grab its credentials:
   ```bash
   turso db create todo-cow
   turso db show todo-cow --url
   turso db tokens create todo-cow
   ```
2. Push the schema against that database with `npm run db:push` (using the Turso credentials in your local `.env`).
3. Import the repo into Vercel and set the `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` environment variables in the project's settings.
4. Deploy - no further configuration is required; the app renders the herd view dynamically on every request.

## Getting Started with Ralph 🤖

This project includes **Ralph**, an autonomous AI development loop that implements features from GitHub issues.

### Workflow

1. **Choose an issue** from the [project board](../../projects)
2. **Generate Ralph files**: `/ralphify <issue-number>`
3. **Run the loop**: `.ralph/ralph.sh 20`
4. **Clean up when done**: `/ralph-cleanup`

### Commands

| Command | Description |
|---------|-------------|
| `/ralphify #123` | Generate `.ralph/` files for issue #123 |
| `.ralph/ralph.sh 20` | Run Ralph loop (max 20 iterations) |
| `/ralph-cleanup` | Archive files and close the GitHub issue |
| `/ralph-cleanup --force` | Archive even if tasks incomplete |
| `/ralph-cleanup --no-close` | Archive but don't close issue |

### Example Session

```bash
# 1. Pick an issue and generate Ralph files
claude
> /ralphify 42

# 2. Run the autonomous loop
.ralph/ralph.sh 20

# 3. Archive and close the issue
claude
> /ralph-cleanup
```

### How Ralph Works

Ralph reads the generated `.ralph/plan.md` file which contains a JSON task list derived from the GitHub issue. Each iteration:

1. Reads the plan to find an incomplete task
2. Implements the task completely
3. Updates `plan.md` (marks task as passed)
4. Logs progress to `activity.md`
5. Verifies with build/tests
6. Continues until all tasks pass or max iterations reached

When complete, `/ralph-cleanup` archives the session to `.ralph/archive/issue-<number>/` and closes the GitHub issue.

See `.claude/commands/` for full command documentation.

## Documentation

- [Product Requirements](./confabulator/PRD.md)
- [Project Vision](./confabulator/project-vision.md)
- [Implementation Plan](./confabulator/implementation-plan.md)
- [Business Model Canvas](./confabulator/business-model-canvas.md)
- [PR-FAQ](./confabulator/PR-FAQ.md)

---

*Generated with [Confabulator](https://vibecodelisboa.com/confabulator)*
