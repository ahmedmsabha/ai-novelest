import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { createClient } from "@/lib/supabase/server"

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

        const { type, context } = await req.json()

        console.log("[generate-suggestion] Type:", type)
        console.log("[generate-suggestion] Context:", context)

        let prompt = ""

        switch (type) {
            case "arc_title":
                prompt = `Generate a compelling title for a story arc.

NOVEL: ${context.novelTitle || "Untitled"}
GENRE: ${context.genre || "fiction"}
TONE: ${context.tone || "balanced"}
ARC POSITION: ${context.arcNumber || 1} (${context.arcNumber === 1 ? 'Beginning/Setup' : context.arcNumber === 2 ? 'Middle/Rising Action' : 'Climax/Resolution'})

${context.novelContext ? `STORY CONTEXT:\n${context.novelContext}\n\n` : ''}
${context.description ? `CURRENT DESCRIPTION: ${context.description}\n\n` : ''}

Create a 2-5 word title for this arc. Examples: "Shadows Awaken", "The Rising Storm", "Broken Alliances"

Respond with ONLY the title, nothing else.`
                break

            case "arc_description":
                prompt = `Generate a description for a story arc.

NOVEL: ${context.novelTitle || "Untitled"}
GENRE: ${context.genre || "fiction"}
TONE: ${context.tone || "balanced"}
ARC TITLE: ${context.arcTitle || `Arc ${context.arcNumber || 1}`}

${context.novelContext ? `STORY CONTEXT:\n${context.novelContext}\n\n` : ''}

Write a 15-25 word description that captures the arc's theme, key events, and character goals.

Respond with ONLY the description, nothing else.`
                break

            case "chapter_title":
                prompt = `Generate a chapter title.

GENRE: ${context.genre || "fiction"}
TONE: ${context.tone || "balanced"}
CURRENT TITLE: ${context.currentTitle || `Chapter ${context.chapterNumber || 1}`}
ARC: ${context.arcTitle || "Main Story"}
${context.summary ? `CHAPTER ABOUT: ${context.summary}\n` : ''}

Create a 2-6 word intriguing title. Examples: "Whispers in the Dark", "A Fateful Meeting", "The Last Stand"

Respond with ONLY the title, nothing else.`
                break

            case "chapter_summary":
                prompt = `Generate a chapter summary.

GENRE: ${context.genre || "fiction"}
TONE: ${context.tone || "balanced"}
CHAPTER: ${context.chapterTitle || `Chapter ${context.chapterNumber || 1}`}
ARC: ${context.arcTitle || "Main Story"}
${context.arcDescription ? `ARC THEME: ${context.arcDescription}\n` : ''}
${context.previousChapter ? `PREVIOUS: ${context.previousChapter}\n` : ''}

Write 2-4 sentences with specific scenes, character actions, and plot progression.

Respond with ONLY the summary, nothing else.`
                break

            default:
                return new Response("Invalid suggestion type", { status: 400 })
        }

        console.log("[generate-suggestion] Full prompt being sent:")
        console.log(prompt)
        console.log("[generate-suggestion] =============================")

        try {
            const result = await generateText({
                model: google("gemini-2.5-flash"),
                prompt: prompt,
                temperature: 0.9,
                maxOutputTokens: 100,
            })

            console.log("[generate-suggestion] Full result object:", JSON.stringify(result, null, 2))

            const text = result.text

            console.log("[generate-suggestion] Raw response text:", JSON.stringify(text))
            console.log("[generate-suggestion] Text length:", text.length)
            console.log("[generate-suggestion] Trimmed:", JSON.stringify(text.trim()))

            const suggestion = text.trim()

            if (!suggestion) {
                console.error("[generate-suggestion] WARNING: Empty response from Gemini!")
                console.error("[generate-suggestion] Full prompt was:")
                console.error(prompt)
                console.error("[generate-suggestion] Result finishReason:", result.finishReason)
                console.error("[generate-suggestion] Result usage:", result.usage)
            }

            return Response.json({ suggestion })
        } catch (genError) {
            console.error("[generate-suggestion] Generation error:", genError)
            throw genError
        }
    } catch (error) {
        console.error("[generate-suggestion] Error:", error)
        return new Response(
            JSON.stringify({
                error: "generation_failed",
                message: error instanceof Error ? error.message : "Failed to generate suggestion",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        )
    }
}
