# Chapter-by-Chapter Novel Generation Guide

## Overview
Revolutionary new system for generating publication-quality novels with consistent word counts and high-quality output.

## How It Works

### 1. **Outline Generation** (`/api/generate-outline`)
When you select "Novel" type and click "Create Novel Chapter-by-Chapter":
- System analyzes your prompt, genre, tone, and length preference
- Generates a detailed outline including:
  - Novel title and logline
  - 3-5 main characters with descriptions
  - Three-act story structure
  - Chapter-by-chapter breakdown with:
    - Chapter numbers and titles
    - Target word counts (1200-1800 per chapter)
    - Chapter summaries
    - Key scenes to include
    - Character focus points
- **Chapter Count by Length:**
  - Short: 8-10 chapters (12,000-18,000 words total)
  - Medium: 12-15 chapters (18,000-27,000 words total)
  - Long: 18-25 chapters (27,000-45,000 words total)

### 2. **Novel Builder Page** (`/app/create-novel/page.tsx`)
After outline generation, you're redirected to the novel builder interface:

#### Three Tabs:
1. **Outline Tab**: View the complete novel plan
2. **Write Chapters Tab**: Main workspace with:
   - Left sidebar: Chapter list with completion status
   - Right panel: Chapter content display with streaming
   - Navigation: Previous/Next buttons between chapters
3. **Preview Tab**: See the full assembled novel

#### Chapter Generation Process:
1. Click any chapter in the sidebar to generate it
2. System streams the chapter content in real-time
3. Each chapter targets 1200-1800 words
4. Previous chapters are passed as context for continuity
5. POV and writing style remain consistent
6. Auto-advances to next chapter with "Next Chapter" button

### 3. **Chapter Generation** (`/api/generate-chapter`)
Individual chapter endpoint that:
- Receives: outline, chapter number, title, summary, previous chapters
- Uses: Gemini 2.0 Flash with 3000 token limit
- Maintains: POV consistency, writing style, narrative continuity
- Ensures: 1200-1800 word target per chapter
- Streams: Real-time content delivery

## Why This Solves the Problems

### Problem 1: Inconsistent Word Counts
**Before:** Single-prompt novels generated 1500 words instead of 3000+
**Now:** Each chapter guaranteed 1200-1800 words × 12-25 chapters = 14,400-45,000 words total

### Problem 2: Quality Issues
**Before:** Long prompts hit token limits and quality degraded
**Now:** Each chapter gets full model attention with fresh context

### Problem 3: Poor Planning
**Before:** Model improvised entire novel in one go
**Now:** Outline-first approach ensures proper story structure, character arcs, and pacing

## User Workflow

```
1. Visit /generate
   ↓
2. Select "Novel" type
   ↓
3. Configure: genre, tone, length, POV, style, language
   ↓
4. Enter prompt
   ↓
5. Click "Create Novel Chapter-by-Chapter"
   ↓
6. System generates outline (uses 1 credit)
   ↓
7. Review outline in novel builder
   ↓
8. Click chapters to generate (uses 1 credit per chapter)
   ↓
9. System streams each chapter with context
   ↓
10. Progress tracked (e.g., "5/12 chapters complete")
    ↓
11. Click "Save Novel" when done
    ↓
12. Novel saved with all chapters combined
    ↓
13. View/download from story page
```

## Technical Details

### API Endpoints
- `POST /api/generate-outline`: Creates chapter plan (non-streaming)
- `POST /api/generate-chapter`: Writes single chapter (streaming)

### Session Storage
- `novel_outline`: Stores outline text between pages
- `novel_metadata`: Stores genre, tone, POV, style, etc.

### State Management
- Chapters array tracks completion status
- Current chapter index for navigation
- Real-time word count display
- Progress percentage calculation

### Credit System
- Outline generation: 1 credit
- Each chapter: 1 credit
- Short novel (8 chapters): 9 credits total
- Medium novel (12 chapters): 13 credits total
- Long novel (18 chapters): 19 credits total

## PDF Export Improvements
- Now uses `jspdf` library for proper PDF generation
- Automatic page breaks and formatting
- Professional layout with title, metadata, chapters
- No more "broken PDF" issues
- Direct download without intermediate HTML file

## Benefits

✅ **Consistent Length**: Always hit target word counts
✅ **Higher Quality**: Each chapter gets full AI attention
✅ **Better Pacing**: Outline ensures proper story structure
✅ **Continuity**: Previous chapters inform next chapters
✅ **Flexibility**: Generate chapters in any order
✅ **Resume-able**: Can pause and continue later (session storage)
✅ **Transparent**: See exactly what you're generating
✅ **Cost Effective**: Only pay for chapters you generate

## Future Enhancements

Potential improvements:
- Save partial novels to database
- Edit individual chapters before finalizing
- Re-generate specific chapters
- Export outline as separate document
- Chapter-level feedback and regeneration
- Collaborative novel writing
- Template outlines for common genres

## Example Output

### Outline Structure:
```
# The Crystal Throne

**Logline:** A young mage discovers she's the heir...

## Main Characters
1. **Aria Stoneheart** - Protagonist, 17-year-old...
2. **Zephyr Nightshade** - Mentor, former court...
[...]

## Story Arc
**Act 1 (Setup)** - Chapters 1-4: Aria discovers...
**Act 2 (Confrontation)** - Chapters 5-10: Training...
**Act 3 (Resolution)** - Chapters 11-15: Final battle...

## Chapter Breakdown

### Chapter 1: The Awakening
**Target Words:** 1200-1800
**Summary:** Aria's magic manifests during...
**Key Scenes:** Market incident, discovery, pursuit
**Character Focus:** Aria's fear and confusion
[...]
```

### Generated Chapter Example:
```
Chapter 1: The Awakening

The morning sun cast long shadows across the cobblestone 
streets of Millhaven as Aria Stoneheart navigated the 
crowded market square. She clutched her basket tightly,
weaving between vendors hawking their wares...

[1500 words of high-quality narrative]
```

---

**Last Updated:** December 2024
**Version:** 1.0
