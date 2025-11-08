# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- A Google AI API key ([Get one here](https://makersuite.google.com/app/apikey))
- A Supabase account ([Sign up here](https://supabase.com))
- A Neon PostgreSQL database ([Sign up here](https://neon.tech))

### 2. Clone and Install

```bash
# Navigate to your project directory
cd ai-story-generator

# Install dependencies
pnpm install
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your credentials
nano .env  # or use your preferred editor
```

Fill in these values in your `.env`:
- `GOOGLE_GENERATIVE_AI_API_KEY` - From Google AI Studio
- `NEXT_PUBLIC_SUPABASE_URL` - From your Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From your Supabase project settings
- `NEON_DATABASE_URL` - From your Neon dashboard

### 4. Setup Database

```bash
# Connect to your Neon database and run migrations
psql $NEON_DATABASE_URL -f scripts/002_create_all_tables.sql
```

Or manually run the SQL in your Neon dashboard's SQL editor.

### 5. Verify Setup

```bash
# Run the setup verification script
pnpm verify
```

### 6. Start Development Server

```bash
# Start the Next.js dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 📝 What's Next?

1. **Create an account** - Sign up to get 15 free story credits
2. **Generate your first story** - Go to the Generate page
3. **Customize** - Choose genre, tone, length, and type
4. **Watch the magic** - See your story generate in real-time
5. **Save and share** - Stories are saved to your library and public gallery

## 🔧 Available Commands

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm start      # Start production server
pnpm lint       # Run ESLint
pnpm verify     # Verify project setup
```

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check your `NEON_DATABASE_URL` is correct
- Ensure your IP is allowed in Neon's settings
- Verify the database exists

### "Supabase authentication error"
- Check your Supabase URL and anon key
- Verify redirect URLs in Supabase dashboard match your app
- Ensure your Supabase project is active

### "API key error"
- Verify your Google AI API key is valid
- Check you haven't exceeded rate limits
- Ensure the key has the correct permissions

### Still stuck?
Check the full [DEVELOPMENT.md](./DEVELOPMENT.md) guide or create an issue.

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini AI](https://ai.google.dev/)
- [Neon Documentation](https://neon.tech/docs)

## 🎨 Project Structure

```
ai-story-generator/
├── app/              # Next.js pages and API routes
├── components/       # React components
├── lib/              # Utilities and configurations
├── public/           # Static assets
├── scripts/          # Database and setup scripts
├── .env             # Your environment variables (create this!)
├── .env.example     # Template for environment variables
└── DEVELOPMENT.md   # Comprehensive development guide
```

## 💡 Tips

- Use TypeScript for better type safety
- Check the error boundaries for debugging
- Monitor your API usage in Google AI Studio
- Use the verify script before deploying

Happy story generating! ✨
