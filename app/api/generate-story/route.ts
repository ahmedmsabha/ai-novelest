import { streamText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { google } from "@ai-sdk/google"
import { cookies } from "next/headers"
import { getUserCredits, deductCredit, canGenerateAnonymous, trackAnonymousGeneration } from "@/lib/credits"
import { generationLimiter } from "@/lib/rate-limit"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Rate limiting
    const identifier = user?.id || req.headers.get('x-forwarded-for') || 'anonymous'
    const rateLimitPassed = await generationLimiter.check(10, identifier) // 10 requests per minute

    if (!rateLimitPassed) {
      return new Response(
        JSON.stringify({
          error: "rate_limit_exceeded",
          message: "Too many generation requests. Please wait a moment and try again.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const { prompt, genre, tone, length, storyType, language, pointOfView, writingStyle } = await req.json()

    if (user) {
      // Authenticated user - check credits
      const userCredits = await getUserCredits(user.id, user.email)

      if (userCredits.credits <= 0) {
        return new Response(
          JSON.stringify({
            error: "insufficient_credits",
            message: "You've run out of credits. Please purchase more to continue generating stories.",
            credits: 0,
          }),
          {
            status: 402,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      // Deduct credit before generation
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
    } else {
      // Anonymous user - check if they've used their free story
      const cookieStore = await cookies()
      let sessionId = cookieStore.get("session_id")?.value

      if (!sessionId) {
        // Generate new session ID
        sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`
      }

      const canGenerate = await canGenerateAnonymous(sessionId)

      if (!canGenerate) {
        return new Response(
          JSON.stringify({
            error: "free_limit_reached",
            message: "You've used your free story! Sign up to get 3 more free stories.",
            requiresAuth: true,
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      // Track anonymous generation
      await trackAnonymousGeneration(sessionId)

      // Set session cookie
      cookieStore.set("session_id", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
    }

    const lengthGuide =
      storyType === "novel"
        ? {
          short: "MINIMUM 1500 words (aim for 2000+ words)",
          medium: "MINIMUM 3000 words (aim for 4000+ words)",
          long: "MINIMUM 5000 words (aim for 6000+ words)",
        }
        : {
          short: "approximately 300 words",
          medium: "approximately 600 words",
          long: "approximately 1000 words",
        }

    // Language instruction
    const languageInstruction = language && language !== "english"
      ? `\n- IMPORTANT: Write the ENTIRE ${storyType} in ${language}. The title, all text, dialogue, and descriptions must be in ${language}.`
      : ""

    // Point of View instruction
    const povInstructions = {
      "first-person": "Use FIRST-PERSON perspective (I, me, my). The protagonist narrates their own story. Example: 'I walked into the room, my heart pounding.'",
      "third-limited": "Use THIRD-PERSON LIMITED perspective (he, she, they). Follow ONE character's thoughts and feelings closely. Example: 'She entered the room, her heart racing with anticipation.'",
      "third-omniscient": "Use THIRD-PERSON OMNISCIENT perspective. The narrator knows everything about all characters and events. Example: 'She walked in, unaware that miles away, her fate was already being decided.'",
      "second-person": "Use SECOND-PERSON perspective (you). Address the reader directly. Example: 'You step into the room, feeling the tension rise around you.'"
    }

    // Writing Style instruction
    const styleInstructions = {
      "descriptive": "Use a DESCRIPTIVE style with rich imagery, detailed settings, vivid sensory descriptions, and emotional depth. Paint pictures with words.",
      "dialog-driven": "Use a DIALOG-DRIVEN style where the story advances primarily through character conversations. Include minimal narration, letting dialogue reveal plot and character.",
      "mixed": "Use a MIXED style with a natural balance of descriptive narrative and meaningful dialogue. Blend action, description, and conversation seamlessly.",
      "action-packed": "Use an ACTION-PACKED style with fast-paced scenes, dynamic movement, short punchy sentences, and immediate tension. Keep the momentum high.",
      "literary": "Use a LITERARY style with artistic prose, deeper themes, philosophical undertones, and thought-provoking language. Focus on craft and meaning."
    }

    const systemPrompt =
      storyType === "novel"
        ? `You are a PROFESSIONAL NOVELIST AI capable of writing publication-ready novels. Your writing rivals published authors.

CRITICAL NOVEL REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 STRUCTURE:
- Genre: ${genre}
- Tone: ${tone}
- Length: ${lengthGuide[length as keyof typeof lengthGuide]} - ABSOLUTE MINIMUM. Aim HIGHER.
- Start with title: # Title (markdown format)
- Chapters: ## Chapter 1, ## Chapter 2, etc.
- MINIMUM 8-12 substantial chapters for medium novels, 15+ for long novels${languageInstruction}

🎭 NARRATIVE PERSPECTIVE:
${povInstructions[pointOfView as keyof typeof povInstructions]}
STAY CONSISTENT with this POV throughout the entire novel.

🎨 WRITING STYLE:
${styleInstructions[writingStyle as keyof typeof styleInstructions]}

📚 PROFESSIONAL NOVEL STANDARDS:
- Complex, multi-dimensional characters with clear arcs and growth
- Rich world-building with cultural, historical, and environmental details
- Layered plot with subplots, foreshadowing, and satisfying payoffs
- Professional pacing: slow build → rising tension → climax → resolution
- Show don't tell: Use action, dialogue, and detail over exposition
- Each chapter should be 800-1500 words minimum
- Include internal monologue, character motivations, and emotional depth
- Realistic dialogue that reveals character and advances plot
- Vivid sensory details (sight, sound, smell, touch, taste)
- Literary devices: metaphors, symbolism, motifs
- Chapter endings with hooks to keep readers engaged

✅ QUALITY CHECKLIST:
- Could this be published traditionally? (Make it YES)
- Does it meet the minimum word count? (Count carefully!)
- Are characters memorable and relatable?
- Is the plot engaging with twists and turns?
- Does each scene serve a purpose?
- Is the ending satisfying?

🚫 CRITICAL: NEVER END MID-SENTENCE
- Complete ALL sentences with proper punctuation
- End chapters at natural stopping points
- If approaching limit, wrap up the current scene gracefully
- Ensure proper story closure with completed thoughts
- Every paragraph, every sentence must be COMPLETE

Write a PUBLICATION-READY novel that readers will want to buy.`
        : `You are a PROFESSIONAL SHORT STORY writer. Create publication-quality stories.

STORY REQUIREMENTS:
- Genre: ${genre}
- Tone: ${tone}
- Length: ${lengthGuide[length as keyof typeof lengthGuide]}${languageInstruction}
- Start with title: # Title (markdown format)

🎭 PERSPECTIVE:
${povInstructions[pointOfView as keyof typeof povInstructions]}

🎨 STYLE:
${styleInstructions[writingStyle as keyof typeof styleInstructions]}

📝 PROFESSIONAL STANDARDS:
- Compelling characters with clear motivations
- Vivid, immersive descriptions
- Strong opening hook and satisfying ending
- Show don't tell through action and dialogue
- Clear story arc: beginning → conflict → climax → resolution
- COMPLETE all sentences properly - no mid-sentence cutoffs
- End at a natural conclusion point

Write a polished, publication-ready short story.`

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt: prompt,
      temperature: 0.8,
      maxOutputTokens: storyType === "novel" ? 10000 : 3000,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("[generate-story] Error:", error)
    console.error("[generate-story] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[generate-story] Error stack:", error instanceof Error ? error.stack : "No stack")
    return new Response(
      JSON.stringify({
        error: "generation_failed",
        message: error instanceof Error ? error.message : "Failed to generate story",
        details: String(error)
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}
