# Development Guide

## Project Overview

StoryForge AI is a Next.js application that generates creative stories and novels using Google's Gemini AI.

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **AI**: Vercel AI SDK v5 + Google Gemini 2.0
- **Authentication**: Supabase Auth
- **Database**: Neon PostgreSQL
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Language**: TypeScript

### Directory Structure

```
app/                    # Next.js app router pages
├── api/               # API routes
│   ├── credits/      # Credit management
│   ├── generate-story/ # Story generation
│   └── stories/      # Story CRUD operations
├── auth/             # Authentication pages
├── credits/          # Credits purchase page
├── gallery/          # Public story gallery
├── generate/         # Story generation interface
├── my-stories/       # User's personal library
└── story/[id]/       # Individual story view

components/            # React components
├── ui/               # shadcn/ui components
├── error-boundary.tsx # Global error handling
└── nav-header.tsx    # Navigation component

lib/                   # Utility functions and configurations
├── supabase/         # Supabase client configurations
├── constants.ts      # Application constants
├── credits.ts        # Credit management logic
├── db.ts             # Database queries
├── env.ts            # Environment validation
├── types.ts          # TypeScript type definitions
└── utils.ts          # Utility functions

scripts/               # Database migration scripts
└── *.sql             # SQL migration files
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### Required Variables

- `GOOGLE_GENERATIVE_AI_API_KEY`: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEON_DATABASE_URL`: Your Neon PostgreSQL connection string

## Database Setup

### Tables

1. **users** - User accounts
2. **stories** - Generated stories
3. **user_credits** - User credit balances
4. **credits_transactions** - Credit transaction history
5. **anonymous_usage** - Anonymous user tracking

### Running Migrations

Execute the SQL scripts in order:

```bash
# 1. Drop existing tables (use with caution!)
psql $NEON_DATABASE_URL -f scripts/001_drop_all_tables.sql

# 2. Create all tables with RLS policies
psql $NEON_DATABASE_URL -f scripts/002_create_all_tables.sql
```

## Development

### Install Dependencies

```bash
pnpm install
```

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm build
```

### Lint Code

```bash
pnpm lint
```

## Features

### Story Generation

- **Types**: Short stories (300-1000 words) or Novels (1500-5000+ words)
- **Genres**: Fantasy, Sci-Fi, Mystery, Romance, Horror, Adventure, Thriller, Comedy
- **Tones**: Adventurous, Dark, Humorous, Mysterious, Romantic, Suspenseful, Whimsical, Dramatic
- **Lengths**: Short, Medium, Long (varies by type)

### Credit System

- **New Users**: 15 free credits on signup
- **Costs**: 1 credit per short story, 2 credits per novel
- **Anonymous**: 3 generations before requiring signup

### Security

- Row Level Security (RLS) on all database tables
- Protected routes with middleware
- Secure session management with Supabase

## API Routes

### POST `/api/generate-story`

Generate a new story.

**Request Body:**
```json
{
  "prompt": "A wizard's first day at school",
  "genre": "fantasy",
  "tone": "adventurous",
  "storyType": "story",
  "length": "medium"
}
```

**Response:** Streaming text response

### GET `/api/stories`

Get all stories (public gallery).

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Story Title",
    "content": "Story content...",
    "genre": "fantasy",
    "tone": "adventurous",
    "word_count": 500,
    "story_type": "story",
    "created_at": "2025-10-29T..."
  }
]
```

### GET `/api/credits`

Get current user's credit balance.

**Response:**
```json
{
  "credits": 5,
  "total_generated": 10
}
```

## Best Practices

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use functional components with hooks
- Implement proper error boundaries
- Validate environment variables on startup

### Component Guidelines

- Keep components small and focused
- Use composition over inheritance
- Implement proper loading states
- Handle errors gracefully
- Use semantic HTML

### Database Queries

- Use parameterized queries (SQL template literals)
- Implement proper error handling
- Use transactions for related operations
- Enable RLS for security

### API Routes

- Validate input data
- Return appropriate status codes
- Implement rate limiting for production
- Use streaming for long-running operations

## Troubleshooting

### Environment Variables Not Loading

Ensure your `.env` file is in the root directory and restart the dev server.

### Database Connection Errors

Check that your `NEON_DATABASE_URL` is correct and the database is accessible.

### Supabase Auth Issues

Verify your Supabase project settings and redirect URLs are configured correctly.

### Build Errors

Clear the `.next` directory and rebuild:

```bash
rm -rf .next
pnpm build
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT
