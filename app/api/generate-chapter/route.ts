import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import { generationLimiter } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"
import { getUserCredits, deductCredit } from "@/lib/credits"

export const maxDuration = 60

export async function POST(req: Request) {
    try {
        // Rate limiting
        const identifier = req.headers.get('x-forwarded-for') || 'anonymous'
        const rateLimitPassed = await generationLimiter.check(20, identifier) // 20 chapters per minute

        if (!rateLimitPassed) {
            return new Response(
                JSON.stringify({
                    error: "rate_limit_exceeded",
                    message: "Too many chapter generation requests. Please wait a moment.",
                }),
                {
                    status: 429,
                    headers: { "Content-Type": "application/json" },
                }
            )
        }

        const {
            outline,
            chapterNumber,
            chapterTitle,
            chapterSummary,
            previousChapters,
            genre,
            tone,
            language,
            pointOfView,
            writingStyle,
            isFirstChapterOfArc, // New parameter to indicate if this is the first chapter of an arc
        } = await req.json()

        // Only deduct credit for the first chapter of each arc
        if (isFirstChapterOfArc) {
            const supabase = await createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (user) {
                const userCredits = await getUserCredits(user.id, user.email)

                if (userCredits.credits <= 0) {
                    return new Response(
                        JSON.stringify({
                            error: "insufficient_credits",
                            message: "You've run out of credits. Each arc costs 1 credit.",
                            credits: 0,
                        }),
                        {
                            status: 402,
                            headers: { "Content-Type": "application/json" },
                        },
                    )
                }

                const deducted = await deductCredit(user.id)
                if (!deducted) {
                    return new Response(
                        JSON.stringify({
                            error: "insufficient_credits",
                            message: "Failed to deduct credit. Please try again.",
                            credits: userCredits.credits,
                        }),
                        {
                            status: 402,
                            headers: { "Content-Type": "application/json" },
                        },
                    )
                }

                console.log(`[generate-chapter] Deducted 1 credit for arc chapter (user: ${user.id})`)
            }
        }

        // Point of View instruction
        const povInstructions = {
            "first-person": "Use FIRST-PERSON perspective (I, me, my) consistently.",
            "third-limited": "Use THIRD-PERSON LIMITED perspective (he, she, they). Stay in one character's head.",
            "third-omniscient": "Use THIRD-PERSON OMNISCIENT perspective with access to all characters' thoughts.",
            "second-person": "Use SECOND-PERSON perspective (you) consistently."
        }

        // Writing Style instruction
        const styleInstructions = {
            "descriptive": "Rich, vivid imagery with detailed sensory descriptions.",
            "dialog-driven": "Advance the story primarily through character dialogue.",
            "mixed": "Balance description, action, and dialogue naturally.",
            "action-packed": "Fast-paced with dynamic scenes and high tension.",
            "literary": "Artistic prose with deeper themes and philosophical elements."
        }

        const languageInstruction = language && language !== "english"
            ? `\n- Write ENTIRELY in ${language}.`
            : ""

        const contextSummary = previousChapters && previousChapters.length > 0
            ? `\n\nPREVIOUS CHAPTERS SUMMARY:\n${previousChapters.map((ch: any, idx: number) =>
                `Chapter ${idx + 1}: ${ch.summary || 'Content generated'}`
            ).join('\n')}\n`
            : ""

        const systemPrompt = `You are a PROFESSIONAL NOVELIST writing Chapter ${chapterNumber} of a novel.

NOVEL CONTEXT:
${outline}
${contextSummary}

CHAPTER ${chapterNumber} SPECIFICATIONS:
Title: ${chapterTitle}
${chapterSummary ? `Summary: ${chapterSummary}` : ''}

WRITING REQUIREMENTS:
- Genre: ${genre}
- Tone: ${tone}
- Target: 1200-1800 WORDS (this is critical - write a full chapter!)${languageInstruction}

🎭 PERSPECTIVE: ${povInstructions[pointOfView as keyof typeof povInstructions]}
🎨 STYLE: ${styleInstructions[writingStyle as keyof typeof styleInstructions]}

PROFESSIONAL STANDARDS:
✅ Start with chapter heading: ## Chapter ${chapterNumber}: ${chapterTitle}
✅ Write 1200-1800 words minimum - this is a FULL chapter
✅ Open with a compelling hook
✅ Include vivid sensory details
✅ Show don't tell through action and dialogue
✅ Develop characters through their actions and words
✅ Maintain consistent POV and tone
✅ Build tension and emotion
✅ End with a complete, satisfying scene - NO CUTOFFS mid-sentence
✅ Stay true to the outline's plot points
✅ Ensure proper chapter closure with a natural ending point

⚠️ CRITICAL ENDING REQUIREMENTS - ABSOLUTE PRIORITY:

YOU MUST COMPLETE EVERY SENTENCE AND THOUGHT.
STOPPING MID-SENTENCE IS THE WORST MISTAKE YOU CAN MAKE.

❌ FORBIDDEN CUTOFF PATTERNS - NEVER DO THIS:
❌ Ending with incomplete sentence: "ليس دمك، أو لحمك، بل"
❌ Ending mid-action: "He walked towards the"
❌ Ending mid-dialogue: "She said, 'I think we should"
❌ Ending mid-description: "The room was filled with"
❌ Ending with conjunction (و، أو، لكن، but, and, or)
❌ Ending without punctuation (. ! ? » " ')

✅ REQUIRED PROPER ENDINGS:
- Every sentence MUST end with punctuation (. ! ?)
- Every dialogue MUST be closed with quotes
- Every thought MUST be completed
- Every paragraph MUST have closure
- The chapter should end at a natural scene break

BEFORE YOU FINISH WRITING:
1. Look at your last sentence
2. Is it COMPLETE with proper punctuation?
3. If NO, FINISH the sentence properly
4. NEVER stop mid-word or mid-phrase
5. Your last word should be followed by: . ! ? » "

EXAMPLES OF PROPER CHAPTER ENDINGS:
✅ Arabic: "أغلق الباب خلفه، وهو يعلم أن شيئاً لن يكون كما كان."
✅ English: "He closed the door behind him, knowing nothing would ever be the same."
✅ Arabic: "سقطت الرسالة من بين أصابعها وتطايرت إلى الأرض."
✅ English: "The letter slipped from her fingers and fluttered to the ground."

EXAMPLES OF FORBIDDEN CUTOFFS (NEVER DO THIS):
❌ "أغلق الباب وبدأ" (stopped mid-action)
❌ "ليس دمك، أو لحمك، بل" (stopped mid-sentence)
❌ "He closed the door and began to" (incomplete)

⚠️ IF YOU'RE APPROACHING TOKEN LIMIT:
- Wrap up your current thought IMMEDIATELY
- Complete the current sentence with proper punctuation
- Add a natural ending phrase
- DO NOT start a new sentence you cannot finish

REMEMBER: A shorter complete chapter is BETTER than a longer incomplete chapter!

✅ ALWAYS end with:
- A complete sentence with proper punctuation (. ! ?)
- A natural scene break or transition
- A cliffhanger that is COMPLETE (not cut off)
- A moment of reflection or resolution
- A completed thought or action

EXAMPLES OF PROPER ENDINGS:
✅ "He closed the door behind him, knowing nothing would ever be the same."
✅ "The letter slipped from her fingers and fluttered to the ground."
✅ "Tomorrow would bring answers—or more questions. Either way, he would be ready."
✅ '"We need to talk," she said, and walked away into the darkness.'

EXAMPLES OF FORBIDDEN CUTOFFS:
❌ "He closed the door and began to"
❌ "The letter contained information about"
❌ "Tomorrow would bring"
❌ "She walked into the"

IMPORTANT: 
- This is ONE chapter of a multi-chapter novel
- Maintain continuity with previous chapters
- Don't rush - take time to develop scenes
- Write beautiful, engaging prose worthy of publication
- COMPLETE your sentences and thoughts before ending
- Read your last sentence - does it END properly? If not, FINISH IT!

Write the FULL chapter now:`

        const result = streamText({
            model: google("gemini-2.5-flash"),
            system: systemPrompt,
            prompt: `Write Chapter ${chapterNumber}: ${chapterTitle}

REMINDER: End with a COMPLETE sentence. Check your last sentence has proper punctuation (. ! ? » ")`,
            temperature: 0.8,
            maxOutputTokens: 5000, // Increased to prevent cutoffs
        })

        return result.toTextStreamResponse()
    } catch (error) {
        console.error("[generate-chapter] Error:", error)
        return new Response(
            JSON.stringify({
                error: "generation_failed",
                message: error instanceof Error ? error.message : "Failed to generate chapter",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        )
    }
}
