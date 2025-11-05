import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function GET() {
    try {
        console.log("Testing Gemini API connection...")

        // Check if API key is set
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return Response.json({
                success: false,
                error: "GOOGLE_GENERATIVE_AI_API_KEY not set"
            }, { status: 500 })
        }

        console.log("API key exists:", process.env.GOOGLE_GENERATIVE_AI_API_KEY.substring(0, 10) + "...")

        // Try a simple generation
        const { text } = await generateText({
            model: google("gemini-2.5-flash"),
            prompt: "Say 'Hello from Gemini!' in exactly those words.",
            maxOutputTokens: 50,
        })

        console.log("Gemini response:", text)

        return Response.json({
            success: true,
            response: text,
            message: "Gemini API is working correctly!"
        })
    } catch (error: any) {
        console.error("Gemini test error:", error)
        return Response.json({
            success: false,
            error: error.message || "Unknown error",
            details: error.toString()
        }, { status: 500 })
    }
}
