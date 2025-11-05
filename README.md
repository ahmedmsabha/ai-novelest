# StoryForge AI - AI Story & Novel Generator

A modern Next.js application that generates creative stories and novels using Google's Gemini AI, with user authentication and personalized galleries.

## Features

- **AI-Powered Generation**: Create short stories or full-length novels using Google Gemini AI
- **User Authentication**: Secure sign-up and login with Supabase Auth
- **Personalized Library**: Save and manage your own stories in a private collection
- **Public Gallery**: Browse stories created by the community
- **Customization Options**: Choose genre, tone, length, and story type
- **Real-time Streaming**: Watch your story generate word-by-word
- **Modern Design**: Beautiful, responsive UI with dark mode support

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **AI**: Vercel AI SDK v5 + Google Gemini 2.0
- **Authentication**: Supabase Auth
- **Database**: Neon PostgreSQL
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Language**: TypeScript

## Environment Variables

You need to set up the following environment variables:

\`\`\`env
# Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Supabase (automatically configured via integration)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# Neon Database (automatically configured via integration)
NEON_DATABASE_URL=your_neon_database_url
\`\`\`

## Getting Started

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment variables** (see above)
4. **Run database migrations**: Execute the SQL scripts in the `scripts/` folder
5. **Start the development server**: `npm run dev`
6. **Open** [http://localhost:3000](http://localhost:3000)

## Database Setup

Run the following SQL scripts in order:

1. `scripts/001_drop_all_tables.sql` - Drops existing tables (use with caution!)
2. `scripts/002_create_all_tables.sql` - Creates all necessary tables with RLS policies

## Usage

1. **Sign Up**: Create a free account to start generating stories
2. **Generate**: Choose between short story or novel, customize parameters
3. **Watch**: See your story generate in real-time with AI streaming
4. **Save**: Add stories to your personal library
5. **Share**: Stories are visible in the public gallery for others to enjoy

## Features in Detail

### Story Types
- **Short Stories**: 300-1000 words, perfect for quick reads
- **Novels**: 1500-5000+ words, with chapters and depth

### Customization
- **8 Genres**: Fantasy, Sci-Fi, Mystery, Romance, Horror, Adventure, Thriller, Comedy
- **8 Tones**: Adventurous, Dark, Humorous, Mysterious, Romantic, Suspenseful, Whimsical, Dramatic
- **3 Length Options**: Short, Medium, Long (varies by story type)

### Security
- Row Level Security (RLS) on all database tables
- Secure authentication with Supabase
- Protected routes with middleware

## License

MIT
