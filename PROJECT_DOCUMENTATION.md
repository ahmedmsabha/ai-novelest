# StoryForge AI - Complete Project Documentation

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [User Flow](#user-flow)
8. [Credit System](#credit-system)
9. [Authentication](#authentication)
10. [AI Story Generation](#ai-story-generation)
11. [PDF Export](#pdf-export)
12. [Deployment](#deployment)
13. [Future Enhancements](#future-enhancements)

---

## 🎯 Project Overview

**StoryForge AI** is a sophisticated AI-powered story and novel generation platform built with Next.js 16, leveraging Google's Gemini 2.5 Flash AI model to create publication-quality stories and novels in multiple languages with customizable genres, tones, and writing styles.

### Key Highlights

- **AI-Powered Generation**: Creates stories from 300 to 6000+ words using advanced AI
- **Multi-Language Support**: Generate stories in English, Arabic, Spanish, French, German, Chinese, Japanese, and more
- **Novel Builder**: Chapter-by-chapter novel creation with arc-based structure
- **RTL Support**: Full right-to-left text support for Arabic, Hebrew, and Persian
- **PDF Export**: High-quality PDF generation with proper Unicode support
- **Credit System**: Fair usage system with 15 free credits for new users
- **Real-time Streaming**: Watch your story generate word-by-word in real-time

---

## ✨ Features

### Story Generation
- **Three Length Options**: Short (300-500 words), Medium (600-800 words), Long (1000+ words)
- **Multiple Genres**: Fantasy, Sci-Fi, Mystery, Romance, Horror, Thriller, Adventure, Historical, Literary Fiction, Comedy
- **Diverse Tones**: Dramatic, Humorous, Dark, Inspirational, Mysterious, Romantic, Adventurous, Melancholic, Whimsical, Serious
- **Point of View Options**: First-person, Third-person Limited, Third-person Omniscient, Second-person
- **Writing Styles**: Descriptive, Dialog-driven, Mixed, Action-packed, Literary

### Novel Generation
- **Arc-Based Structure**: Organize your novel into multiple story arcs
- **Chapter-by-Chapter Creation**: Generate one chapter at a time with full context awareness
- **Outline System**: AI generates a detailed outline before writing
- **Chapter Management**: Edit, reorder, add, or delete chapters and arcs
- **Context Preservation**: Each chapter considers all previous content
- **Auto-Save**: Progress automatically saved to session storage

### User Features
- **Authentication**: Secure signup/login via Supabase Auth
- **Personal Library**: View and manage all your created stories
- **Public Gallery**: Browse stories created by the community
- **Download Options**: Export as TXT or PDF format
- **Story Deletion**: Remove unwanted stories from your library
- **Credit Tracking**: Real-time credit balance display
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

### AI Features
- **Smart Title Generation**: AI suggests engaging titles based on your prompt
- **Outline Generation**: Creates structured multi-arc novel outlines
- **Context-Aware Writing**: Maintains consistency across chapters
- **Quality Control**: Detects incomplete sentences and chapter cutoffs
- **Retry Logic**: Automatic retries for failed generations
- **Rate Limiting**: Prevents abuse while allowing legitimate use

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 16**: React framework with App Router
- **React 19.2**: Latest React with server components
- **TypeScript 5**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling with dark mode support
- **Shadcn/ui**: High-quality component library
- **Lucide React**: Beautiful icon system

### Backend
- **Next.js API Routes**: Serverless backend functions
- **Vercel AI SDK**: Streaming AI responses
- **Google Gemini 2.5 Flash**: Advanced language model
- **Neon PostgreSQL**: Serverless database
- **Supabase Auth**: Authentication and user management

### Libraries & Tools
- **html2canvas**: HTML to canvas conversion for PDF
- **jsPDF**: PDF generation with multi-page support
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **React Toastify**: User notifications
- **Date-fns**: Date formatting utilities

---

## 🏗️ Architecture

### Application Structure

```
ai-story-generator/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── credits/             # Credit management
│   │   ├── generate-story/      # Story generation
│   │   ├── generate-outline/    # Novel outline generation
│   │   ├── generate-chapter/    # Chapter generation
│   │   ├── generate-title/      # Title suggestions
│   │   └── stories/             # CRUD operations
│   ├── auth/                    # Authentication pages
│   ├── create-novel/            # Novel builder interface
│   ├── generate/                # Story generator interface
│   ├── gallery/                 # Public story gallery
│   ├── my-stories/              # User's story library
│   ├── story/[id]/              # Story detail page
│   └── credits/                 # Credits page
├── components/                   # React components
│   ├── ui/                      # Reusable UI components
│   ├── nav-header.tsx           # Navigation header
│   └── theme-provider.tsx       # Dark mode provider
├── lib/                         # Utility libraries
│   ├── db.ts                    # Database queries
│   ├── db-connection.ts         # Database connection
│   ├── credits.ts               # Credit system logic
│   ├── supabase/                # Supabase client/server
│   ├── analytics.ts             # Event tracking
│   └── rate-limit.ts            # Rate limiting
└── public/                      # Static assets
```

### Data Flow

1. **User Input** → Form submission (prompt, genre, tone, etc.)
2. **Validation** → Check credits and rate limits
3. **AI Request** → Send to Gemini API with system prompt
4. **Streaming** → Receive response in real-time chunks
5. **Display** → Update UI incrementally
6. **Storage** → Save completed story to database
7. **Export** → Generate PDF/TXT for download

---

## 🗄️ Database Schema

### Tables

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `user_credits`
```sql
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  credits INTEGER DEFAULT 15,
  total_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `stories`
```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  prompt TEXT NOT NULL,
  genre TEXT NOT NULL,
  tone TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  user_id UUID REFERENCES users(id),
  story_type TEXT CHECK (story_type IN ('story', 'novel')),
  is_published BOOLEAN DEFAULT false,
  outline TEXT,
  chapters_data TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `credits_transactions`
```sql
CREATE TABLE credits_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `anonymous_usage`
```sql
CREATE TABLE anonymous_usage (
  session_id TEXT PRIMARY KEY,
  stories_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 API Endpoints

### Story Generation

#### `POST /api/generate-story`
Generate a short story with streaming response.

**Request Body:**
```json
{
  "prompt": "A brave knight on a quest",
  "genre": "fantasy",
  "tone": "adventurous",
  "length": "medium",
  "storyType": "story",
  "language": "english",
  "pointOfView": "third-limited",
  "writingStyle": "mixed"
}
```

**Response:** Text stream (real-time)

**Credits:** 1 credit per story

---

#### `POST /api/generate-outline`
Generate a structured novel outline.

**Request Body:**
```json
{
  "prompt": "Epic fantasy saga",
  "genre": "fantasy",
  "tone": "dramatic",
  "numberOfArcs": 4,
  "chaptersPerArc": 3,
  "language": "english"
}
```

**Response:**
```json
{
  "outline": "# Novel Title\n\n## Arc 1: Beginning\n..."
}
```

**Credits:** 1 credit per outline

---

#### `POST /api/generate-chapter`
Generate a single chapter with context.

**Request Body:**
```json
{
  "outline": "Full novel outline...",
  "chapterNumber": 1,
  "chapterTitle": "The Journey Begins",
  "chapterSummary": "Hero leaves home",
  "previousChapters": [],
  "isFirstChapterOfArc": true,
  "genre": "fantasy",
  "tone": "adventurous"
}
```

**Response:** Text stream (real-time)

**Credits:** 1 credit per arc (only first chapter)

---

#### `POST /api/generate-title`
Generate title suggestions.

**Request Body:**
```json
{
  "prompt": "Story about time travel",
  "genre": "sci-fi",
  "tone": "mysterious"
}
```

**Response:**
```json
{
  "title": "Echoes Across Time"
}
```

**Credits:** Free

---

### Story Management

#### `GET /api/stories`
Get all public stories.

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Story Title",
    "genre": "fantasy",
    "tone": "adventurous",
    "story_type": "story",
    "created_at": "2025-11-08",
    "preview": "First 200 characters...",
    "user_id": "uuid"
  }
]
```

---

#### `GET /api/stories/[id]`
Get a specific story.

**Response:**
```json
{
  "id": "uuid",
  "title": "Story Title",
  "content": "Full story content...",
  "prompt": "Original prompt",
  "genre": "fantasy",
  "tone": "adventurous",
  "word_count": 1500,
  "story_type": "story",
  "created_at": "2025-11-08",
  "user_id": "uuid"
}
```

---

#### `POST /api/stories`
Save a new story.

**Request Body:**
```json
{
  "title": "My Story",
  "content": "Story content...",
  "prompt": "Story prompt",
  "genre": "fantasy",
  "tone": "adventurous",
  "word_count": 1500,
  "story_type": "story",
  "isPublished": true,
  "outline": "Novel outline...",
  "chaptersData": "JSON string..."
}
```

---

#### `DELETE /api/stories/[id]`
Delete a story (owner only).

**Response:**
```json
{
  "success": true,
  "message": "Story deleted successfully"
}
```

---

### Credits

#### `GET /api/credits`
Get user's credit balance.

**Response:**
```json
{
  "user_id": "uuid",
  "credits": 12,
  "total_generated": 3,
  "created_at": "2025-11-08",
  "updated_at": "2025-11-08"
}
```

---

## 👤 User Flow

### New User Journey

1. **Landing Page** → User sees gallery of public stories
2. **Sign Up** → Creates account with email/password
3. **Welcome Bonus** → Receives 15 free credits automatically
4. **Generate First Story** → Goes to /generate page
5. **Fill Form** → Selects genre, tone, length, language, etc.
6. **Generate** → Watches story generate in real-time
7. **Save Story** → Stores in personal library
8. **Download** → Exports as PDF or TXT
9. **Explore** → Views other stories in gallery

### Novel Creation Journey

1. **Navigate to Generate** → Click "Create Novel" tab
2. **Fill Novel Form** → Set parameters (4 arcs × 3 chapters = 12 chapters)
3. **Generate Outline** → AI creates structured outline (1 credit)
4. **Review Outline** → Check arc and chapter structure
5. **Start Novel Builder** → Redirected to /create-novel
6. **Generate Chapters** → Click to generate each chapter
   - First chapter of Arc 1 → 1 credit deducted
   - Chapters 2-3 of Arc 1 → Free
   - First chapter of Arc 2 → 1 credit deducted
   - And so on... (4 credits total)
7. **Edit & Refine** → Modify chapters as needed
8. **Save Novel** → Store complete novel in library
9. **Download** → Export multi-chapter PDF

---

## 💳 Credit System

### Credit Allocation

- **New Users**: 15 free credits on signup
- **Anonymous Users**: 1 free story (no signup)
- **Credit Costs**:
  - Short Story: 1 credit
  - Novel Outline: 1 credit
  - Novel Arc: 1 credit (includes all chapters in that arc)

### Credit Examples

**Example 1: Short Stories**
- User has 15 credits
- Creates 10 short stories
- Remaining: 5 credits

**Example 2: Novel (4 arcs, 3 chapters each)**
- Generate outline: 1 credit
- Arc 1 (3 chapters): 1 credit
- Arc 2 (3 chapters): 1 credit
- Arc 3 (3 chapters): 1 credit
- Arc 4 (3 chapters): 1 credit
- **Total: 5 credits for 12-chapter novel**

**Example 3: Mixed Usage**
- 5 short stories: 5 credits
- 1 novel (3 arcs): 4 credits (outline + 3 arcs)
- **Total: 9 credits used, 6 remaining**

### Credit Management

- Credits never expire
- Track usage in `/credits` page
- Transactions logged in database
- Network error fallback (returns default credits)
- Insufficient credits → Redirect to credits page

---

## 🔐 Authentication

### Supabase Auth Integration

**Features:**
- Email/password authentication
- Secure session management
- Server and client-side auth
- Protected API routes
- User metadata storage

**Auth Flow:**

1. **Sign Up**: `/auth/sign-up`
   - Create account with email/password
   - Auto-creates user record in database
   - Grants 15 welcome credits
   - Redirects to success page

2. **Login**: `/auth/login`
   - Email/password verification
   - Creates secure session
   - Redirects to generate page

3. **Logout**: `/auth/logout`
   - Clears session
   - Redirects to home page

4. **Protected Routes**:
   - Check user session on server
   - Redirect to login if unauthenticated
   - Allow anonymous with limitations

---

## 🤖 AI Story Generation

### Google Gemini 2.5 Flash Integration

**Model Configuration:**
```typescript
{
  model: "gemini-2.5-flash",
  temperature: 0.8,        // Creativity level
  maxOutputTokens: 10000   // For novels
}
```

### System Prompt Engineering

**Short Story Prompt Structure:**
```
You are a PROFESSIONAL SHORT STORY writer.

REQUIREMENTS:
- Genre: [user selection]
- Tone: [user selection]
- Length: [300/600/1000 words]
- Language: [user selection]

PERSPECTIVE: [First/Third/Second person instructions]
STYLE: [Descriptive/Dialog/Mixed/Action/Literary]

STANDARDS:
- Compelling characters
- Vivid descriptions
- Strong opening and ending
- Complete sentences
- Clear story arc
```

**Novel Chapter Prompt Structure:**
```
You are a PROFESSIONAL NOVELIST writing Chapter X.

NOVEL CONTEXT:
[Full outline]
[Previous chapters summary]

CHAPTER SPECIFICATIONS:
Title: [Chapter title]
Summary: [Chapter summary]

REQUIREMENTS:
- Target: 1200-1800 words
- Genre: [genre]
- Tone: [tone]
- Perspective: [POV]
- Style: [writing style]
- Language: [language]

CONTINUITY:
- Reference previous events
- Maintain character consistency
- Advance the plot
- End with hook for next chapter
```

### Streaming Response Handling

**Frontend Implementation:**
```typescript
const reader = response.body?.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  
  const chunk = decoder.decode(value, { stream: true })
  accumulatedText += chunk
  setGeneratedStory(accumulatedText) // Update UI
}
```

### Quality Control

**Chapter Cutoff Detection:**
- Checks for incomplete sentences
- Detects mid-word breaks
- Warns user if chapter seems incomplete
- Validates proper endings with punctuation

**Retry Logic:**
- Network errors: 5 attempts with exponential backoff
- Database timeouts: 3 attempts per query
- Rate limiting: Prevents spam while allowing bursts

---

## 📄 PDF Export

### PDF Generation Pipeline

1. **HTML Container Creation**
   - Create hidden div with story content
   - Apply proper formatting and styles
   - Set width to A4 dimensions (210mm)

2. **RTL Detection**
   - Scan content for Arabic/Hebrew/Persian characters
   - Set text direction: RTL or LTR
   - Adjust alignment accordingly

3. **HTML to Canvas** (html2canvas)
   - Convert formatted HTML to image
   - Scale: 2x for high quality
   - Sanitize CSS colors (avoid Lab/LCH)
   - Remove external stylesheets

4. **Canvas to PDF** (jsPDF)
   - Create A4 portrait PDF
   - Add canvas as image
   - Handle multi-page content
   - Split long content across pages

5. **Download**
   - Generate blob
   - Trigger browser download
   - Clean up temporary elements

### Arabic/RTL Support

**Encoding Solution:**
- ✅ Uses html2canvas (renders Unicode correctly)
- ✅ Detects RTL languages automatically
- ✅ Sets proper text direction
- ✅ Maintains formatting and styling
- ❌ Old approach: jsPDF direct text (garbled Arabic)

**Implementation:**
```typescript
const hasArabic = /[\u0600-\u06FF]/.test(content)
if (hasArabic) {
  container.style.direction = "rtl"
  container.style.textAlign = "right"
}
```

---

## 🚀 Deployment

### Vercel Deployment

**Environment Variables Required:**
```env
# AI
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Database
NEON_DATABASE_URL=postgresql://...

# Authentication
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Redirects
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
NEXT_PUBLIC_PROD_SUPABASE_REDIRECT_URL=https://yourdomain.com
```

**Build Configuration:**
```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "devCommand": "pnpm dev"
}
```

**Deployment Steps:**

1. **Connect Repository**
   - Link GitHub repo to Vercel
   - Auto-deploy on push to master

2. **Configure Environment**
   - Add all environment variables
   - Set production URLs

3. **Database Setup**
   - Run SQL migrations on Neon
   - Test database connection

4. **Deploy**
   - Vercel auto-builds and deploys
   - Edge functions for API routes
   - CDN for static assets

5. **Verify**
   - Test authentication
   - Generate sample story
   - Check PDF export

---

## 🔮 Future Enhancements

### Planned Features

1. **Credit Purchasing**
   - Stripe payment integration
   - Multiple credit packages
   - Volume discounts
   - Subscription plans

2. **Advanced AI Features**
   - Story continuation/expansion
   - Character development assistant
   - Plot suggestion engine
   - Writing style analyzer

3. **Collaboration**
   - Share stories with friends
   - Collaborative writing mode
   - Comment and feedback system
   - Story forking/remixing

4. **Publishing**
   - Export to EPUB format
   - Amazon Kindle integration
   - Story marketplace
   - Royalty tracking

5. **Social Features**
   - Follow favorite authors
   - Like and bookmark stories
   - Reading lists
   - Author profiles

6. **Analytics**
   - Reading time tracking
   - Popular genres dashboard
   - Generation statistics
   - User engagement metrics

7. **Premium Features**
   - Custom AI models
   - Priority generation queue
   - Advanced editing tools
   - Unlimited story storage

8. **Mobile Apps**
   - iOS native app
   - Android native app
   - Offline story reading
   - Push notifications

### Technical Improvements

- [ ] Implement caching layer (Redis)
- [ ] Add full-text search (Algolia)
- [ ] Optimize PDF generation performance
- [ ] Add comprehensive error tracking (Sentry)
- [ ] Implement A/B testing framework
- [ ] Add automated testing suite
- [ ] Set up CI/CD pipeline
- [ ] Implement rate limiting per user tier
- [ ] Add WebSocket for real-time features
- [ ] Optimize database queries with indexes

---

## 📊 Key Metrics

### Performance Targets

- **Story Generation**: < 30 seconds for short stories
- **Chapter Generation**: < 45 seconds per chapter
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms (excluding AI)
- **Database Query Time**: < 100ms
- **PDF Generation**: < 5 seconds for 10-page story

### User Metrics

- **Free Credits**: 15 per new user
- **Anonymous Limit**: 1 free story
- **Rate Limit**: 10 generations per minute
- **Max Story Length**: 10,000 tokens (novels)
- **Supported Languages**: 15+
- **Genres Available**: 10
- **Writing Styles**: 5

---

## 🤝 Contributing

### Development Setup

1. Clone repository
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env.local`
4. Set up database: Run migrations
5. Start dev server: `pnpm dev`

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Use double quotes, proper formatting
- **Commits**: Conventional commit messages
- **Testing**: Test before committing
- **Documentation**: Update docs with features

---

## 📝 License

MIT License - See LICENSE file for details

---

## 👨‍💻 Developer Contact

For questions, issues, or contributions, please:
- Open an issue on GitHub
- Submit a pull request
- Contact: [Your contact info]

---

## 🙏 Acknowledgments

- **Google Gemini**: AI model provider
- **Vercel**: Hosting and deployment
- **Supabase**: Authentication service
- **Neon**: Database hosting
- **Shadcn/ui**: Component library
- **Next.js Team**: Framework development

---

**Last Updated**: November 8, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
