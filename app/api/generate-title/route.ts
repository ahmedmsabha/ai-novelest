import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { createClient } from "@/lib/supabase/server"
import { apiLimiter } from "@/lib/rate-limit"

export const maxDuration = 30

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return new Response("Unauthorized", { status: 401 })
        }

        // Rate limiting
        const rateLimitPassed = await apiLimiter.check(5, user.id) // 5 title generations per minute

        if (!rateLimitPassed) {
            return new Response(
                JSON.stringify({
                    error: "rate_limit_exceeded",
                    message: "Too many title generation requests. Please wait a moment.",
                }),
                {
                    status: 429,
                    headers: { "Content-Type": "application/json" },
                }
            )
        }

        const { prompt, genre, tone } = await req.json()

        const titlePrompt = `Generate a captivating novel title.

NOVEL CONCEPT: ${prompt}
GENRE: ${genre}
TONE: ${tone}

Create a memorable, evocative title (2-6 words) that captures the essence of this story.
Consider the genre conventions and tone.

Examples by genre:
- Fantasy: "The Shadow's Crown", "Whispers of Starlight"
- Mystery: "The Silent Witness", "Midnight's Secret"
- Romance: "Hearts Unbound", "Love's Second Chance"
- Sci-Fi: "Beyond the Void", "Echoes of Tomorrow"

Respond with ONLY the title, nothing else. No quotes, no explanation.`

        const result = await generateText({
            model: google("gemini-2.0-flash-exp"),
            prompt: titlePrompt,
            temperature: 0.9,
            maxOutputTokens: 50,
        })

        const title = result.text.trim().replace(/^["']|["']$/g, '')

        return Response.json({ title })
    } catch (error) {
        console.error("[generate-title] Error:", error)
        return new Response(
            JSON.stringify({
                error: "generation_failed",
                message: error instanceof Error ? error.message : "Failed to generate title",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        )
    }
}
