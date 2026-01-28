# Claude Code Configuration

This file contains instructions for Claude Code when working with this project.

## Project Overview

DnD-Master is a web application for Dungeons & Dragons campaign management built with Next.js, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Runtime**: Node.js 18+

## Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
│   ├── api/          # API routes
│   ├── globals.css   # Global styles
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── components/       # React components (to be created)
├── lib/              # Utility functions and shared code
└── types/            # TypeScript type definitions
```

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Conventions

### Code Style

- Use TypeScript for all new files
- Use functional components with hooks
- Use Tailwind CSS for styling
- Follow Next.js App Router conventions

### File Naming

- Components: PascalCase (e.g., `CharacterCard.tsx`)
- Utilities: camelCase (e.g., `diceRoller.ts`)
- Types: PascalCase with `.types.ts` suffix (e.g., `Character.types.ts`)

### Git Workflow

- Create feature branches from `main`
- Use descriptive commit messages
- Create PRs for all changes and request review before merging

## API Routes

API routes are located in `src/app/api/`. Each route should:
- Export HTTP method handlers (GET, POST, etc.)
- Use `NextResponse` for responses
- Include proper error handling

## Testing

(To be configured)

## Environment Variables

Create a `.env.local` file for local development:

```
# Add environment variables here
```

## Active Technologies
- TypeScript 5.x (frontend and backend) (001-ai-dungeon-master)
- PostgreSQL via Supabase (campaigns, sessions, characters, events) (001-ai-dungeon-master)

## Recent Changes
- 001-ai-dungeon-master: Added TypeScript 5.x (frontend and backend)
