import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { createClient } from "@/lib/supabase/server"
import { getUserCredits, deductCredit } from "@/lib/credits"

export const maxDuration = 60

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return new Response("Unauthorized", { status: 401 })
        }

        const { prompt, genre, tone, length, language, pointOfView, writingStyle, numberOfArcs, chaptersPerArc, suggestedTitle } = await req.json()

        // Check credits
        const userCredits = await getUserCredits(user.id, user.email)
        if (userCredits.credits <= 0) {
            return new Response(
                JSON.stringify({
                    error: "insufficient_credits",
                    message: "You need credits to generate a novel outline.",
                    credits: 0,
                }),
                { status: 402, headers: { "Content-Type": "application/json" } }
            )
        }

        // Use user-specified numbers or fall back to defaults based on length
        const defaultChapterCounts = {
            short: { arcs: 2, chaptersPerArc: 4 }, // 8 chapters total
            medium: { arcs: 3, chaptersPerArc: 5 }, // 15 chapters total
            long: { arcs: 3, chaptersPerArc: 8 }, // 24 chapters total
        }
        const structure = {
            arcs: numberOfArcs || defaultChapterCounts[length as keyof typeof defaultChapterCounts].arcs,
            chaptersPerArc: chaptersPerArc || defaultChapterCounts[length as keyof typeof defaultChapterCounts].chaptersPerArc
        }

        const languageInstruction = language && language !== "english"
            ? `Write the outline in ${language}.`
            : ""

        const outlinePrompt = `You are a professional novel outliner. Create a DETAILED chapter-by-chapter outline for a novel organized into story arcs.

⚠️⚠️⚠️ ABSOLUTE REQUIREMENT - THIS IS NON-NEGOTIABLE ⚠️⚠️⚠️
You MUST create EXACTLY ${structure.arcs} arcs with EXACTLY ${structure.chaptersPerArc} chapters in EACH arc.
Total chapters REQUIRED: ${structure.arcs * structure.chaptersPerArc} chapters (${structure.chaptersPerArc} chapters × ${structure.arcs} arcs)

If you create ${structure.arcs - 1} arcs or ${structure.arcs + 1} arcs, you have FAILED.
If any arc has ${structure.chaptersPerArc - 1} or ${structure.chaptersPerArc + 1} chapters, you have FAILED.
Count your arcs and chapters before submitting. Every arc needs ${structure.chaptersPerArc} chapters.

NOVEL SPECIFICATIONS:
${suggestedTitle ? `- Title: ${suggestedTitle}` : ''}
- Concept: ${prompt}
- Genre: ${genre}
- Tone: ${tone}
- Point of View: ${pointOfView}
- Writing Style: ${writingStyle}
${languageInstruction}

STRUCTURE REQUIREMENTS (NON-NEGOTIABLE):
- Number of Arcs: ${structure.arcs} (no more, no less)
- Chapters per Arc: ${structure.chaptersPerArc} (every arc must have exactly this many chapters)
- Total Chapters: ${structure.arcs * structure.chaptersPerArc}

CREATE A STRUCTURED OUTLINE WITH ARCS:

${suggestedTitle ? '' : '1. **Novel Title**: Create a compelling title'}
2. **Logline**: One-sentence story summary
3. **Main Characters**: List 3-5 key characters with brief descriptions

4. **ARC BREAKDOWN**: Organize the story into ${structure.arcs} major arcs (acts), each containing ${structure.chaptersPerArc} chapters

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

${suggestedTitle ? `# ${suggestedTitle}` : '# [Novel Title]'}

**Logline:** [One sentence summary]

## Main Characters
- **[Character Name]**: [Description]
- **[Character Name]**: [Description]

## Arc 1: [Arc Title/Description]
**Theme:** [What this arc explores]
**Goal:** [What characters are trying to achieve]

### Chapter 1: [Chapter Title]
**Summary:** [What happens in this chapter - 2-3 sentences]
**Key Scenes:**
- [Scene 1]
- [Scene 2]
**Character Focus:** [Which characters are central]

### Chapter 2: [Chapter Title]
**Summary:** [What happens in this chapter - 2-3 sentences]
**Key Scenes:**
- [Scene 1]
- [Scene 2]
**Character Focus:** [Which characters are central]

${Array.from({ length: structure.chaptersPerArc - 2 }, (_, i) => `### Chapter ${i + 3}: [Chapter Title]\n[Details...]`).join('\n\n')}

## Arc 2: [Arc Title/Description]
**Theme:** [What this arc explores]
**Goal:** [What characters are trying to achieve]

### Chapter ${structure.chaptersPerArc + 1}: [Chapter Title]
**Summary:** [What happens in this chapter - 2-3 sentences]
**Key Scenes:**
- [Scene 1]
- [Scene 2]
**Character Focus:** [Which characters are central]

${Array.from({ length: structure.chaptersPerArc - 1 }, (_, i) => `### Chapter ${structure.chaptersPerArc + i + 2}: [Chapter Title]\n[Details...]`).join('\n\n')}

${Array.from({ length: structure.arcs - 2 }, (_, arcIndex) => {
    const arcNum = arcIndex + 3;
    const startChapter = structure.chaptersPerArc * (arcNum - 1) + 1;
    return `## Arc ${arcNum}: [Arc Title/Description]
**Theme:** [What this arc explores]
**Goal:** [What characters are trying to achieve]

${Array.from({ length: structure.chaptersPerArc }, (_, chapterIndex) => 
    `### Chapter ${startChapter + chapterIndex}: [Chapter Title]\n[Details...]`
).join('\n\n')}`;
}).join('\n\n')}

⚠️ REMINDER: You MUST include ALL ${structure.arcs} arcs with EXACTLY ${structure.chaptersPerArc} chapters each (${structure.arcs * structure.chaptersPerArc} total chapters).

Create a professional, detailed outline with clear arc structure that will guide the writing of a publication-ready novel.`

        const { text: outline } = await generateText({
            model: google("gemini-2.5-flash"),
            prompt: outlinePrompt,
            temperature: 0.5, // Lower temperature for more consistent structure
            maxOutputTokens: 8000, // Increase to allow full outline
        })

        console.log("[generate-outline] Generated outline, length:", outline.length)

        // Validate the structure
        const arcMatches = outline.match(/^## Arc \d+:/gm) || []
        const chapterMatches = outline.match(/^### Chapter \d+:/gm) || []
        
        console.log(`[generate-outline] Validation:`)
        console.log(`  - Requested: ${structure.arcs} arcs × ${structure.chaptersPerArc} chapters = ${structure.arcs * structure.chaptersPerArc} total`)
        console.log(`  - Generated: ${arcMatches.length} arcs, ${chapterMatches.length} chapters`)
        
        if (arcMatches.length !== structure.arcs) {
            console.warn(`[generate-outline] ⚠️ Arc count mismatch! Expected ${structure.arcs}, got ${arcMatches.length}`)
        }
        
        if (chapterMatches.length !== structure.arcs * structure.chaptersPerArc) {
            console.warn(`[generate-outline] ⚠️ Chapter count mismatch! Expected ${structure.arcs * structure.chaptersPerArc}, got ${chapterMatches.length}`)
        }

        // If structure is wrong, try regenerating with even more explicit prompt
        if (arcMatches.length !== structure.arcs || chapterMatches.length !== structure.arcs * structure.chaptersPerArc) {
            console.log("[generate-outline] Attempting regeneration with stricter prompt...")
            
            const strictPrompt = `STRICT INSTRUCTIONS - FOLLOW EXACTLY:

You MUST create a novel outline with:
- EXACTLY ${structure.arcs} arcs (no more, no less)
- EXACTLY ${structure.chaptersPerArc} chapters in EACH arc
- Total of EXACTLY ${structure.arcs * structure.chaptersPerArc} chapters

Novel Details:
${suggestedTitle ? `Title: ${suggestedTitle}` : ''}
Concept: ${prompt}
Genre: ${genre}
Tone: ${tone}
${languageInstruction}

Format each arc as:
## Arc [NUMBER]: [Title]

Format each chapter as:
### Chapter [NUMBER]: [Title]
**Summary:** [2-3 sentences]

Start with Arc 1, Chapter 1.
Count chapters continuously (Arc 1: Chapters 1-${structure.chaptersPerArc}, Arc 2: Chapters ${structure.chaptersPerArc + 1}-${structure.chaptersPerArc * 2}, etc.)

DO NOT skip arcs or chapters. Create ALL ${structure.arcs} arcs with ALL ${structure.chaptersPerArc} chapters each.`

            const { text: strictOutline } = await generateText({
                model: google("gemini-2.5-flash"),
                prompt: strictPrompt,
                temperature: 0.3, // Even lower temperature
                maxOutputTokens: 8000,
            })

            // Validate again
            const newArcMatches = strictOutline.match(/^## Arc \d+:/gm) || []
            const newChapterMatches = strictOutline.match(/^### Chapter \d+:/gm) || []
            
            console.log(`[generate-outline] Regeneration result:`)
            console.log(`  - Generated: ${newArcMatches.length} arcs, ${newChapterMatches.length} chapters`)
            
            // Use the better result
            if (newArcMatches.length === structure.arcs && newChapterMatches.length === structure.arcs * structure.chaptersPerArc) {
                console.log("[generate-outline] ✅ Regeneration successful!")
                return Response.json({ outline: strictOutline })
            }
        }

        return Response.json({ outline })
    } catch (error) {
        console.error("[generate-outline] Error:", error)
        return new Response(
            JSON.stringify({
                error: "generation_failed",
                message: error instanceof Error ? error.message : "Failed to generate outline",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        )
    }
}
