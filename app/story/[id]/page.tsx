"use client"

import { useEffect, useState } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, BookOpen, FileText, Sparkles, Download, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import jsPDF from "jspdf"

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [story, setStory] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [chapters, setChapters] = useState<Array<{ title: string; content: string }>>([])
  const [storyId, setStoryId] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      const { id } = await params
      setStoryId(id)

      // Fetch story from API
      const response = await fetch(`/api/stories/${id}`)
      if (!response.ok) {
        notFound()
        return
      }

      const storyData = await response.json()
      setStory(storyData)

      // Parse chapters if it's a novel
      if (storyData.story_type === "novel") {
        const parsedChapters = parseChapters(storyData.content)
        setChapters(parsedChapters)
      }

      const supabase = createClient()
      const { data: { user: userData } } = await supabase.auth.getUser()
      setUser(userData)
      setIsOwner(!!(userData && storyData.user_id === userData.id))
    }

    loadData()
  }, [params])

  // Function to parse chapters from content
  const parseChapters = (content: string): Array<{ title: string; content: string }> => {
    // Split by ## Chapter headings
    const parts = content.split(/(?=##\s)/g)
    const parsedChapters: Array<{ title: string; content: string }> = []

    parts.forEach((part, index) => {
      const trimmedPart = part.trim()
      if (trimmedPart) {
        // Extract chapter title
        const titleMatch = trimmedPart.match(/^##\s+(.+)$/m)
        const title = titleMatch ? titleMatch[1] : index === 0 ? "Introduction" : `Chapter ${index}`

        // Get content (everything after the title line)
        const contentAfterTitle = titleMatch
          ? trimmedPart.substring(trimmedPart.indexOf('\n') + 1).trim()
          : trimmedPart

        parsedChapters.push({
          title,
          content: contentAfterTitle
        })
      }
    })

    return parsedChapters.length > 0 ? parsedChapters : [{ title: "Full Content", content }]
  }

  if (!story) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleDownloadTxt = () => {
    const blob = new Blob([story.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${story.title}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded!",
      description: "Story has been downloaded as TXT.",
    })
  }

  const handleDownloadPdf = async () => {
    try {
      toast({
        title: "Generating PDF...",
        description: "Please wait while we create your PDF.",
      })

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - margin * 2
      let yPosition = margin

      const addText = (
        text: string,
        fontSize: number,
        isBold: boolean = false,
        align: "left" | "center" = "left"
      ) => {
        pdf.setFontSize(fontSize)
        pdf.setFont("helvetica", isBold ? "bold" : "normal")

        const lines = pdf.splitTextToSize(text, maxWidth)

        lines.forEach((line: string) => {
          if (yPosition + fontSize * 0.5 > pageHeight - margin) {
            pdf.addPage()
            yPosition = margin
          }

          const xPos = align === "center" ? pageWidth / 2 : margin
          pdf.text(line, xPos, yPosition, { align })
          yPosition += fontSize * 0.5
        })

        yPosition += 3
      }

      // Title
      addText(story.title, 20, true, "center")
      yPosition += 5

      // Metadata
      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      const metaText = `${story.story_type === "novel" ? "Novel" : "Short Story"} | ${story.genre} | ${story.tone}`
      pdf.text(metaText, pageWidth / 2, yPosition, { align: "center" })
      yPosition += 10
      pdf.setTextColor(0, 0, 0)

      // Separator
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      // Content
      if (story.story_type === "novel" && chapters.length > 1) {
        chapters.forEach((chapter, index) => {
          if (chapter.content) {
            addText(`Chapter: ${chapter.title}`, 16, true, "left")
            yPosition += 5
            addText(chapter.content, 11, false, "left")

            if (index < chapters.length - 1) {
              yPosition += 10
            }
          }
        })
      } else {
        addText(story.content, 11, false, "left")
      }

      // Save
      pdf.save(`${story.title.replace(/[^a-zA-Z0-9\s]/g, "_")}.pdf`)

      toast({
        title: "Downloaded!",
        description: "Story has been downloaded as PDF.",
      })
    } catch (error) {
      console.error("PDF generation error:", error)
      toast({
        title: "PDF generation failed",
        description: "Please try TXT format instead.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteStory = async () => {
    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete story")
      }

      toast({
        title: "Story deleted!",
        description: "Your story has been permanently deleted.",
      })

      // Redirect to my stories page
      router.push("/my-stories")
    } catch (error) {
      console.error("Error deleting story:", error)
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete story.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={isOwner ? "/my-stories" : "/gallery"}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to {isOwner ? "My Stories" : "Gallery"}
            </Button>
          </Link>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadTxt}>
                  <FileText className="mr-2 h-4 w-4" />
                  Download as TXT
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPdf}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Download as HTML/PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/gallery">
              <Button variant="ghost">Gallery</Button>
            </Link>
            {user && (
              <Link href="/generate">
                <Button className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Create New
                </Button>
              </Link>
            )}
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your story
                      &quot;{story.title}&quot; from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteStory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Story
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              {story.story_type === "novel" ? (
                <div className="flex items-center gap-2 text-primary">
                  <BookOpen className="w-6 h-6" />
                  <span className="text-sm font-medium uppercase tracking-wide">Novel</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-6 h-6" />
                  <span className="text-sm font-medium uppercase tracking-wide">Short Story</span>
                </div>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance leading-tight">{story.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(story.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>{story.word_count} words</span>
              </div>
              {isOwner && (
                <Badge variant="default" className="bg-primary/10 text-primary">
                  Your {story.story_type}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="secondary" className="text-sm">
                {story.genre}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {story.tone}
              </Badge>
            </div>

            <Card className="bg-muted/30 border-muted">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Original Prompt:</span> {story.prompt}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-muted">
            <CardContent className="pt-8 pb-8">
              {story.story_type === "novel" && chapters.length > 1 ? (
                <>
                  {/* Chapter Navigation */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentChapter(Math.max(0, currentChapter - 1))}
                      disabled={currentChapter === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="text-center">
                      <div className="font-semibold text-lg">{chapters[currentChapter]?.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Chapter {currentChapter + 1} of {chapters.length}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentChapter(Math.min(chapters.length - 1, currentChapter + 1))}
                      disabled={currentChapter === chapters.length - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  {/* Chapter Content */}
                  <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground min-h-[400px]">
                    <div className="whitespace-pre-wrap leading-relaxed text-pretty">
                      {chapters[currentChapter]?.content}
                    </div>
                  </div>

                  {/* Chapter Navigation Bottom */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentChapter(Math.max(0, currentChapter - 1))}
                      disabled={currentChapter === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous Chapter
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      {currentChapter + 1} / {chapters.length}
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentChapter(Math.min(chapters.length - 1, currentChapter + 1))}
                      disabled={currentChapter === chapters.length - 1}
                    >
                      Next Chapter
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground">
                  <div className="whitespace-pre-wrap leading-relaxed text-pretty">{story.content}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 flex gap-4 justify-center flex-wrap">
            <Link href="/gallery">
              <Button variant="outline">Browse More Stories</Button>
            </Link>
            {user ? (
              <Link href="/generate">
                <Button className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Create Another
                </Button>
              </Link>
            ) : (
              <Link href="/auth/sign-up">
                <Button className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Sign Up to Create
                </Button>
              </Link>
            )}
          </div>
        </article>
      </main>
    </div>
  )
}
