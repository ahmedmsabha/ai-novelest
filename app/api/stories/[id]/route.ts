import { getStoryById } from "@/lib/db"
import { NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { createClient } from "@/lib/supabase/server"

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const story = await getStoryById(id)

        if (!story) {
            return new Response("Story not found", { status: 404 })
        }

        return Response.json(story)
    } catch (error) {
        console.error("[v0] Error fetching story:", error)
        return new Response("Failed to fetch story", { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Check authentication
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if story exists and belongs to user
        const storyResult = await sql`SELECT user_id FROM stories WHERE id = ${id}`

        if (storyResult.length === 0) {
            return Response.json({ error: "Story not found" }, { status: 404 })
        }

        if (storyResult[0].user_id !== user.id) {
            return Response.json(
                { error: "Forbidden - You can only delete your own stories" },
                { status: 403 }
            )
        }

        // Delete the story
        await sql`DELETE FROM stories WHERE id = ${id}`

        console.log(`[stories/DELETE] Deleted story ${id} for user ${user.id}`)

        return Response.json({ success: true, message: "Story deleted successfully" })
    } catch (error) {
        console.error("[stories/DELETE] Error:", error)
        return Response.json({ error: "Failed to delete story" }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Check authentication
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if story exists and belongs to user
        const storyResult = await sql`SELECT user_id FROM stories WHERE id = ${id}`

        if (storyResult.length === 0) {
            return Response.json({ error: "Story not found" }, { status: 404 })
        }

        if (storyResult[0].user_id !== user.id) {
            return Response.json(
                { error: "Forbidden - You can only update your own stories" },
                { status: 403 }
            )
        }

        const { title, content, isPublished, outline, chaptersData } = await req.json()

        // Update the story
        await sql`
            UPDATE stories 
            SET 
                title = ${title},
                content = ${content},
                is_published = ${isPublished || false},
                outline = ${outline || null},
                chapters_data = ${chaptersData || null},
                updated_at = NOW()
            WHERE id = ${id}
        `

        console.log(`[stories/PUT] Updated story ${id} for user ${user.id}`)

        return Response.json({ success: true, id, message: "Story updated successfully" })
    } catch (error) {
        console.error("[stories/PUT] Error:", error)
        return Response.json({ error: "Failed to update story" }, { status: 500 })
    }
}
