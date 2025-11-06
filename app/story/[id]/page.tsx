"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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

interface Story {
  id: string
  title: string
  content: string
  genre: string
  tone: string
  story_type: string
  word_count: number
  created_at: string
  user_id: string
  is_public: boolean
}

interface Chapter {
  title: string
  content: string
}

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [story, setStory] = useState<Story | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [storyId, setStoryId] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      try {
        const resolvedParams = await params
        const id = resolvedParams.id
        setStoryId(id)

        const response = await fetch(`/api/stories/${id}`)
        if (!response.ok) {
          router.push("/my-stories")
          return
        }

        const storyData = await response.json()
        setStory(storyData)

        if (storyData.story_type === "novel") {
          const parsedChapters = parseChapters(storyData.content)
          setChapters(parsedChapters)
        }

        const supabase = createClient()
        const { data: { user: userData } } = await supabase.auth.getUser()
        setUser(userData)
        setIsOwner(!!(userData && storyData.user_id === userData.id))
      } catch (error) {
        console.error("Error loading story:", error)
        router.push("/my-stories")
      }
    }

    loadData()
  }, [params, router])

  const parseChapters = (content: string): Chapter[] => {
    const parts = content.split(/(?=##\s)/g)
    const parsedChapters: Chapter[] = []

    parts.forEach((part, index) => {
      const trimmedPart = part.trim()
      if (trimmedPart) {
        const titleMatch = trimmedPart.match(/^##\s+(.+)$/m)
        const title = titleMatch ? titleMatch[1] : index === 0 ? "Introduction" : `Chapter ${index}`
        const contentAfterTitle = titleMatch
          ? trimmedPart.substring(trimmedPart.indexOf('\n') + 1).trim()
          : trimmedPart

        parsedChapters.push({ title, content: contentAfterTitle })
      }
    })

    return parsedChapters.length > 0 ? parsedChapters : [{ title: "Full Content", content }]
  }

  const handleDownloadTxt = () => {
    if (!story) return

    const blob = new Blob([story.content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${story.title.replace(/[^a-zA-Z0-9\s]/g, "_")}.txt`
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
    if (!story) return

    try {
      toast({
        title: "Generating PDF...",
        description: "This may take a moment for large stories.",
      })

      // Import jsPDF dynamically to avoid SSR issues
      const { default: jsPDF } = await import("jspdf")

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
    if (!story) return

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

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const currentChapter = chapters[currentChapterIndex]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={isOwner ? "/my-stories" : "/gallery"}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleDownloadTxt}>
                  <FileText className="w-4 h-4 mr-2" />
                  Download as TXT
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPdf}>
                  <Download className="w-4 h-4 mr-2" />
                  Download as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Story?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete &quot;{story.title}&quot;.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteStory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-3xl font-bold">{story.title}</h1>
                  {story.story_type === "novel" ? (
                    <BookOpen className="w-8 h-8 text-primary flex-shrink-0" />
                  ) : (
                    <FileText className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {story.story_type === "novel" ? "Novel" : "Short Story"}
                  </Badge>
                  <Badge variant="outline">{story.genre}</Badge>
                  <Badge variant="outline">{story.tone}</Badge>
                  <Badge variant="outline">{story.word_count.toLocaleString()} words</Badge>
                  {chapters.length > 1 && (
                    <Badge variant="outline">{chapters.length} chapters</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Created on {formatDate(story.created_at)}</span>
                </div>
              </div>

              {story.story_type === "novel" && chapters.length > 1 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-y">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentChapterIndex(Math.max(0, currentChapterIndex - 1))}
                      disabled={currentChapterIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>

                    <span className="text-sm font-medium">
                      Chapter {currentChapterIndex + 1} of {chapters.length}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentChapterIndex(Math.min(chapters.length - 1, currentChapterIndex + 1))}
                      disabled={currentChapterIndex === chapters.length - 1}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <h2 className="text-2xl font-bold mb-4">{currentChapter.title}</h2>
                    <div className="whitespace-pre-wrap">{currentChapter.content}</div>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap">{story.content}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
