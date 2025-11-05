import { createClient } from "@/lib/supabase/server"
import { createStory, getAllStories } from "@/lib/db"

export async function GET() {
  try {
    const stories = await getAllStories()

    const storiesWithPreview = stories.map((story) => ({
      id: story.id,
      title: story.title,
      genre: story.genre,
      tone: story.tone,
      story_type: story.story_type,
      created_at: story.created_at,
      preview: story.content.substring(0, 200),
      user_id: story.user_id,
    }))

    return Response.json(storiesWithPreview)
  } catch (error) {
    console.error("[v0] Error fetching stories:", error)
    return new Response("Failed to fetch stories", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[stories/POST] Unauthorized - no user")
      return new Response("Unauthorized", { status: 401 })
    }

    const { title, content, genre, tone, length, prompt, storyType } = await req.json()

    console.log("[stories/POST] Saving story:", {
      title,
      storyType,
      contentLength: content?.length,
      userId: user.id
    })

    const wordCount = content.split(/\s+/).length

    const story = await createStory({
      title,
      content,
      genre,
      tone,
      word_count: wordCount,
      prompt,
      user_id: user.id,
      story_type: storyType || "story",
    })

    console.log("[stories/POST] Story saved successfully:", story.id, story.story_type)

    return Response.json({ id: story.id })
  } catch (error) {
    console.error("[stories/POST] Error saving story:", error)
    return new Response(JSON.stringify({
      error: "Failed to save story",
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
