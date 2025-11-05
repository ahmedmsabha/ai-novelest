import { getStoryById } from "@/lib/db"
import { NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { createClient } from "@/lib/supabase/server"
import { toast } from "react-toastify"

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

export const handleDownloadPdf = async (story, chapters) => {
    try {
        toast({
            title: "Generating PDF...",
            description: "Please wait while we create your PDF.",
        })

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        })

        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const margin = 20
        const maxWidth = pageWidth - (margin * 2)
        let yPosition = margin

        // Helper function to add text with page breaks
        const addText = (text: string, fontSize: number, isBold: boolean = false, align: 'left' | 'center' = 'left') => {
            pdf.setFontSize(fontSize)
            pdf.setFont("helvetica", isBold ? "bold" : "normal")

            const lines = pdf.splitTextToSize(text, maxWidth)

            for (const line of lines) {
                if (yPosition + 10 > pageHeight - margin) {
                    pdf.addPage()
                    yPosition = margin
                }
                const xPos = align === 'center' ? pageWidth / 2 : margin
                pdf.text(line, xPos, yPosition, { align })
                yPosition += fontSize * 0.5
            }

            yPosition += 3
        }

        // Title
        addText(story.title, 24, true, 'center')
        yPosition += 5

        // Metadata
        pdf.setFontSize(10)
        pdf.setTextColor(100, 100, 100)
        const metaText = `Type: ${story.story_type === "novel" ? "Novel" : "Short Story"} | Genre: ${story.genre} | Tone: ${story.tone}`
        pdf.text(metaText, pageWidth / 2, yPosition, { align: 'center' })
        yPosition += 10
        pdf.setTextColor(0, 0, 0)

        // Separator line
        pdf.setLineWidth(0.5)
        pdf.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 10

        // Process content
        if (story.story_type === "novel" && chapters.length > 1) {
            // For novels with chapters
            chapters.forEach((chapter) => {
                if (chapter.content) {
                    addText(`Chapter ${chapter.number}: ${chapter.title}`, 18, true, 'center')
                    yPosition += 5
                    addText(chapter.content, 11, false)

                    // Add page break between chapters
                    if (yPosition > margin + 10) {
                        pdf.addPage()
                        yPosition = margin
                    }
                }
            })
        } else {
            // For short stories or novels without parsed chapters
            addText(story.content, 11, false)
        }

        // Save PDF
        pdf.save(`${story.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)

        toast({
            title: "Downloaded!",
            description: "Your story has been downloaded as PDF.",
        })
    } catch (error) {
        console.error("PDF generation error:", error)
        toast({
            title: "PDF generation failed",
            description: "Failed to generate PDF. Please try again.",
            variant: "destructive",
        })
    }
}
