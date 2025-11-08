"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, ArrowLeft, Loader2, BookOpen, FileText, Coins, Download, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { analytics } from "@/lib/analytics"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function GeneratePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [prompt, setPrompt] = useState("")
  const [genre, setGenre] = useState("fantasy")
  const [tone, setTone] = useState("adventurous")
  const [storyType, setStoryType] = useState<"story" | "novel">("story")
  const [length, setLength] = useState("medium")
  const [language, setLanguage] = useState("english")
  const [pointOfView, setPointOfView] = useState("third-limited")
  const [writingStyle, setWritingStyle] = useState("mixed")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedStory, setGeneratedStory] = useState("")
  const [storyTitle, setStoryTitle] = useState("")
  const [credits, setCredits] = useState<number | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [numberOfArcs, setNumberOfArcs] = useState(3)
  const [chaptersPerArc, setChaptersPerArc] = useState(5)
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)
  const [suggestedTitle, setSuggestedTitle] = useState("")

  // Update arc/chapter counts when length changes
  useEffect(() => {
    if (storyType === "novel") {
      const defaults: Record<string, { arcs: number; chapters: number }> = {
        short: { arcs: 2, chapters: 4 },
        medium: { arcs: 3, chapters: 5 },
        long: { arcs: 3, chapters: 8 },
      }
      const config = defaults[length] || defaults.medium
      setNumberOfArcs(config.arcs)
      setChaptersPerArc(config.chapters)
    }
  }, [length, storyType])

  useEffect(() => {
    fetchCredits()
  }, [])

  const fetchCredits = async () => {
    try {
      const response = await fetch("/api/credits")
      const data = await response.json()
      setCredits(data.credits)
      setIsAnonymous(data.isAnonymous)
    } catch (error) {
      console.error("[v0] Error fetching credits:", error)
    }
  }

  const handleGenerateTitle = async (): Promise<void> => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a story concept first to generate a title.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingTitle(true)

    try {
      const response = await fetch("/api/generate-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, genre, tone }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate title")
      }

      const data = await response.json()
      setSuggestedTitle(data.title)

      toast({
        title: "Title generated!",
        description: `Suggestion: "${data.title}"`,
      })

      // Track with proper typing
      analytics.titleGenerated({ genre, tone })
    } catch (error) {
      console.error("Error generating title:", error)
      toast({
        title: "Title generation failed",
        description: "Failed to generate title. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingTitle(false)
    }
  }

  const handleGenerateOutline = async (): Promise<void> => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a story prompt to generate an outline.",
        variant: "destructive",
      })
      return
    }

    console.log(`[generate] Starting outline generation with ${numberOfArcs} arcs × ${chaptersPerArc} chapters`)

    setIsGenerating(true)

    try {
      let finalTitle = suggestedTitle
      if (!finalTitle) {
        try {
          const titleResponse = await fetch("/api/generate-title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, genre, tone }),
          })
          if (titleResponse.ok) {
            const titleData = await titleResponse.json()
            finalTitle = titleData.title
            setSuggestedTitle(finalTitle)
          }
        } catch (error) {
          console.log("Could not generate title, continuing anyway:", error)
        }
      }

      const response = await fetch("/api/generate-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          genre,
          tone,
          length,
          language,
          pointOfView,
          writingStyle,
          numberOfArcs,
          chaptersPerArc,
          suggestedTitle: finalTitle,
        }),
      })

      if (response.status === 402) {
        const data = await response.json()
        toast({
          title: "Insufficient credits",
          description: data.message,
          variant: "destructive",
        })
        router.push("/credits")
        return
      }

      if (response.status === 403) {
        const data = await response.json()
        toast({
          title: "Free limit reached",
          description: data.message,
          variant: "destructive",
        })
        router.push("/auth/sign-up")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to generate outline")
      }

      const data = await response.json()

      // Track analytics with proper typing
      analytics.outlineGenerated({
        genre,
        tone,
        numberOfArcs,
        chaptersPerArc,
        hasTitle: !!finalTitle,
      })

      toast({
        title: "Outline created!",
        description: "Redirecting to novel builder...",
      })

      const metadata = {
        prompt,
        genre,
        tone,
        length,
        language,
        pointOfView,
        writingStyle,
      }

      sessionStorage.setItem("novel_outline", data.outline)
      sessionStorage.setItem("novel_metadata", JSON.stringify(metadata))

      router.push("/create-novel")
    } catch (error) {
      console.error("Error generating outline:", error)
      toast({
        title: "Generation failed",
        description: "Failed to generate outline. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
      fetchCredits()
    }
  }

  const handleGenerate = async (): Promise<void> => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a story prompt to generate content.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGeneratedStory("")
    setStoryTitle("")

    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          genre, 
          tone, 
          length, 
          storyType, 
          language, 
          pointOfView, 
          writingStyle 
        }),
      })

      if (response.status === 402) {
        const data = await response.json()
        toast({
          title: "Insufficient credits",
          description: data.message,
          variant: "destructive",
        })
        router.push("/credits")
        return
      }

      if (response.status === 403) {
        const data = await response.json()
        toast({
          title: "Free limit reached",
          description: data.message,
          variant: "destructive",
        })
        router.push("/auth/sign-up")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to generate story")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let accumulatedText = ""
      let hasSeenTitle = false

      console.log("[generate] Starting to read stream...")

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log("[generate] Stream complete, final length:", accumulatedText.length)
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        console.log("[generate] Received chunk, length:", chunk.length)
        
        // For text stream, just append directly
        accumulatedText += chunk

        // Extract title if not already found
        if (!hasSeenTitle && accumulatedText.includes("#")) {
          const titleMatch = accumulatedText.match(/^#\s+(.+)$/m)
          if (titleMatch) {
            const extractedTitle = titleMatch[1].trim()
            setStoryTitle(extractedTitle)
            hasSeenTitle = true
            console.log("[generate] Title extracted:", extractedTitle)
          }
        }

        // Update display with accumulated text
        setGeneratedStory(accumulatedText)
      }

      console.log("[generate] Final story length:", accumulatedText.length)

      // Track analytics
      analytics.storyGenerated({
        genre,
        tone,
        length,
        storyType,
        wordCount: accumulatedText.split(/\s+/).length,
      })

      toast({
        title: `${storyType === "novel" ? "Novel" : "Story"} generated!`,
        description: "Your content is ready. You can now save it.",
      })

      fetchCredits()
    } catch (error) {
      console.error("Error generating story:", error)
      toast({
        title: "Generation failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedStory || !storyTitle) {
      toast({
        title: "Nothing to save",
        description: "Please generate content first.",
        variant: "destructive",
      })
      return
    }

    if (generatedStory.trim().length < 50) {
      toast({
        title: "Story too short",
        description: "The generated story appears to be empty or too short. Please try generating again.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Attempting to save story...")
      console.log("Title:", storyTitle)
      console.log("Content length:", generatedStory.length)
      console.log("Genre:", genre, "Tone:", tone, "Length:", length)

      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: storyTitle,
          content: generatedStory,
          genre,
          tone,
          length,
          prompt,
          storyType,
        }),
      })

      if (response.status === 401) {
        toast({
          title: "Authentication required",
          description: "Please log in to save your story.",
          variant: "destructive",
        })
        router.push("/auth/login")
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Save error:", response.status, errorText)
        throw new Error(`Failed to save story: ${errorText}`)
      }

      const { id } = await response.json()
      console.log("Story saved successfully with ID:", id)

      toast({
        title: `${storyType === "novel" ? "Novel" : "Story"} saved!`,
        description: "Your content has been saved to your library.",
      })

      router.push(`/story/${id}`)
    } catch (error) {
      console.error("[v0] Error saving story:", error)
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save content. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadTxt = () => {
    if (!generatedStory) return

    const blob = new Blob([generatedStory], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${storyTitle || "story"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded!",
      description: "Your story has been downloaded as TXT.",
    })
  }

  const handleDownloadPdf = async () => {
    if (!generatedStory) return

    try {
      toast({
        title: "Generating PDF...",
        description: "Please wait while we create your PDF.",
      })

      // Create a hidden container with the story content
      const container = document.createElement("div")
      container.style.position = "absolute"
      container.style.left = "-9999px"
      container.style.width = "210mm" // A4 width
      container.style.padding = "20mm"
      container.style.backgroundColor = "white"
      container.style.fontFamily = "Arial, sans-serif"
      container.style.fontSize = "12pt"
      container.style.lineHeight = "1.6"
      container.style.color = "black"

      // Detect if content contains Arabic/RTL text
      const hasArabic = /[\u0600-\u06FF]/.test(generatedStory) || /[\u0600-\u06FF]/.test(storyTitle)
      if (hasArabic) {
        container.style.direction = "rtl"
        container.style.textAlign = "right"
      }

      // Add title
      const titleEl = document.createElement("h1")
      titleEl.textContent = storyTitle || "Untitled Story"
      titleEl.style.fontSize = "24pt"
      titleEl.style.fontWeight = "bold"
      titleEl.style.marginBottom = "10mm"
      titleEl.style.textAlign = hasArabic ? "right" : "center"
      container.appendChild(titleEl)

      // Add metadata
      const metaEl = document.createElement("p")
      metaEl.textContent = `${storyType === "novel" ? "Novel" : "Short Story"} | ${genre} | ${tone}`
      metaEl.style.color = "#666"
      metaEl.style.fontSize = "10pt"
      metaEl.style.marginBottom = "10mm"
      metaEl.style.textAlign = hasArabic ? "right" : "center"
      container.appendChild(metaEl)

      // Add separator
      const hr = document.createElement("hr")
      hr.style.border = "none"
      hr.style.borderTop = "1px solid #ccc"
      hr.style.marginBottom = "10mm"
      container.appendChild(hr)

      // Add content
      const contentEl = document.createElement("div")
      contentEl.style.whiteSpace = "pre-wrap"
      contentEl.style.wordWrap = "break-word"
      contentEl.textContent = generatedStory
      container.appendChild(contentEl)

      document.body.appendChild(container)

      // Generate canvas from HTML with error handling
      let canvas
      try {
        canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: "#ffffff",
          ignoreElements: (element) => {
            return element.classList?.contains('no-pdf') || false
          },
          onclone: (clonedDoc) => {
            const clonedContainer = clonedDoc.querySelector('div[style*="position: absolute"]')
            if (clonedContainer instanceof HTMLElement) {
              // Helper function to convert any color to RGB or fallback
              const getSafeColor = (color: string, fallback: string): string => {
                if (!color || color === 'transparent' || color.includes('lab(') || color.includes('lch(') || color.includes('oklch(') || color.includes('var(')) {
                  return fallback
                }
                if (color.startsWith('rgb') || color.startsWith('#')) {
                  return color
                }
                return fallback
              }

              clonedContainer.style.color = '#000000'
              clonedContainer.style.backgroundColor = '#ffffff'
              clonedContainer.style.borderColor = '#cccccc'
              
              const allElements = clonedContainer.querySelectorAll('*')
              allElements.forEach((el) => {
                if (el instanceof HTMLElement) {
                  try {
                    const computedStyle = window.getComputedStyle(el)
                    el.style.color = getSafeColor(computedStyle.color, '#000000')
                    el.style.backgroundColor = getSafeColor(computedStyle.backgroundColor, 'transparent')
                    el.style.borderColor = getSafeColor(computedStyle.borderColor, '#cccccc')
                    el.style.removeProperty('--tw-prose-body')
                    el.style.removeProperty('--tw-prose-headings')
                    el.style.removeProperty('--tw-prose-links')
                  } catch (e) {
                    el.style.color = '#000000'
                    el.style.backgroundColor = 'transparent'
                  }
                }
              })

              const styleSheets = clonedDoc.querySelectorAll('link[rel="stylesheet"], style')
              styleSheets.forEach(sheet => sheet.remove())
            }
          },
        })
      } catch (error) {
        document.body.removeChild(container)
        console.error("html2canvas error details:", error)
        throw error
      }

      document.body.removeChild(container)

      // Create PDF from canvas
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * pdfWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`${storyTitle || "story"}.pdf`)

      toast({
        title: "Downloaded!",
        description: "Your story has been downloaded as PDF.",
      })
    } catch (error) {
      console.error("Error downloading PDF:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("Error details:", errorMessage)
      
      toast({
        title: "Download failed",
        description: `${errorMessage}. Try downloading as TXT instead.`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Home</span>
          </Link>
          <div className="flex items-center gap-4">
            {credits !== null && (
              <Link href="/credits">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Coins className="w-4 h-4" />
                  {isAnonymous ? "1 Free Story" : `${credits} Credits`}
                </Button>
              </Link>
            )}
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">StoryForge AI</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Create Your Story</h2>
            <p className="text-muted-foreground">Customize your parameters and let AI bring your vision to life</p>
          </div>

          {isAnonymous && (
            <Alert className="mb-6">
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Free Trial</AlertTitle>
              <AlertDescription>
                You have 1 free story generation.{" "}
                <Link href="/auth/sign-up" className="underline font-semibold">
                  Sign up
                </Link>{" "}
                to get 3 more free stories!
              </AlertDescription>
            </Alert>
          )}

          {!isAnonymous && credits !== null && credits <= 1 && (
            <Alert className="mb-6">
              <Coins className="h-4 w-4" />
              <AlertTitle>Low Credits</AlertTitle>
              <AlertDescription>
                You have {credits} credit{credits !== 1 ? "s" : ""} remaining.{" "}
                <Link href="/credits" className="underline font-semibold">
                  Purchase more credits
                </Link>{" "}
                to continue generating stories.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Story Parameters</CardTitle>
                  <CardDescription>Configure your creation settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Tabs value={storyType} onValueChange={(v) => setStoryType(v as "story" | "novel")}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="story" className="gap-2">
                          <FileText className="w-4 h-4" />
                          Short Story
                        </TabsTrigger>
                        <TabsTrigger value="novel" className="gap-2">
                          <BookOpen className="w-4 h-4" />
                          Novel
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <p className="text-xs text-muted-foreground">
                      {storyType === "story"
                        ? "A complete short story (300-1000 words)"
                        : "A longer narrative with chapters and depth (1000+ words)"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Select value={genre} onValueChange={setGenre}>
                      <SelectTrigger id="genre">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fantasy">Fantasy</SelectItem>
                        <SelectItem value="sci-fi">Science Fiction</SelectItem>
                        <SelectItem value="mystery">Mystery</SelectItem>
                        <SelectItem value="romance">Romance</SelectItem>
                        <SelectItem value="horror">Horror</SelectItem>
                        <SelectItem value="adventure">Adventure</SelectItem>
                        <SelectItem value="thriller">Thriller</SelectItem>
                        <SelectItem value="comedy">Comedy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone">Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger id="tone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adventurous">Adventurous</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="humorous">Humorous</SelectItem>
                        <SelectItem value="mysterious">Mysterious</SelectItem>
                        <SelectItem value="romantic">Romantic</SelectItem>
                        <SelectItem value="suspenseful">Suspenseful</SelectItem>
                        <SelectItem value="whimsical">Whimsical</SelectItem>
                        <SelectItem value="dramatic">Dramatic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="length">Length</Label>
                    <Select value={length} onValueChange={setLength}>
                      <SelectTrigger id="length">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {storyType === "story" ? (
                          <>
                            <SelectItem value="short">Short (~300 words)</SelectItem>
                            <SelectItem value="medium">Medium (~600 words)</SelectItem>
                            <SelectItem value="long">Long (~1000 words)</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="short">Brief (1500-2000 words)</SelectItem>
                            <SelectItem value="medium">Standard (3000-4000 words)</SelectItem>
                            <SelectItem value="long">Extended (5000-6000 words)</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="spanish">Spanish (Español)</SelectItem>
                        <SelectItem value="french">French (Français)</SelectItem>
                        <SelectItem value="german">German (Deutsch)</SelectItem>
                        <SelectItem value="italian">Italian (Italiano)</SelectItem>
                        <SelectItem value="portuguese">Portuguese (Português)</SelectItem>
                        <SelectItem value="chinese">Chinese (中文)</SelectItem>
                        <SelectItem value="japanese">Japanese (日本語)</SelectItem>
                        <SelectItem value="korean">Korean (한국어)</SelectItem>
                        <SelectItem value="arabic">Arabic (العربية)</SelectItem>
                        <SelectItem value="russian">Russian (Русский)</SelectItem>
                        <SelectItem value="hindi">Hindi (हिन्दी)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pointOfView">🎭 Narrative Point of View</Label>
                    <Select value={pointOfView} onValueChange={setPointOfView}>
                      <SelectTrigger id="pointOfView">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first-person">First-Person (I, Me) - Character tells story</SelectItem>
                        <SelectItem value="third-limited">Third-Person Limited - Follows one character</SelectItem>
                        <SelectItem value="third-omniscient">Third-Person Omniscient - All-knowing</SelectItem>
                        <SelectItem value="second-person">Second-Person (You) - Reader in story</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="writingStyle">🎨 Writing Style</Label>
                    <Select value={writingStyle} onValueChange={setWritingStyle}>
                      <SelectTrigger id="writingStyle">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="descriptive">Descriptive - Rich imagery & details</SelectItem>
                        <SelectItem value="dialog-driven">Dialog-Driven - Story through conversations</SelectItem>
                        <SelectItem value="mixed">Mixed - Balanced description & dialogue</SelectItem>
                        <SelectItem value="action-packed">Action-Packed - Fast-paced scenes</SelectItem>
                        <SelectItem value="literary">Literary - Artistic, thought-provoking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {storyType === "novel" && (
                    <>
                      {/* AI Title Generator */}
                      <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <Label>✨ AI Novel Title</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Generate a creative title for your novel (optional)
                        </p>
                        <Button
                          onClick={handleGenerateTitle}
                          disabled={isGeneratingTitle || !prompt.trim()}
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                        >
                          {isGeneratingTitle ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating Title...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Generate AI Title
                            </>
                          )}
                        </Button>
                        {suggestedTitle && (
                          <div className="mt-2 p-3 bg-background rounded border">
                            <p className="text-sm font-medium text-primary">"{suggestedTitle}"</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              This title will be used for your novel
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="numberOfArcs">📚 Number of Arcs</Label>
                          <Input
                            id="numberOfArcs"
                            type="number"
                            min="1"
                            max="10"
                            value={numberOfArcs}
                            onChange={(e) => setNumberOfArcs(parseInt(e.target.value) || 3)}
                            className="w-full"
                          />
                          <p className="text-xs text-muted-foreground">Story arcs (default: 3)</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="chaptersPerArc">📖 Chapters per Arc</Label>
                          <Input
                            id="chaptersPerArc"
                            type="number"
                            min="1"
                            max="20"
                            value={chaptersPerArc}
                            onChange={(e) => setChaptersPerArc(parseInt(e.target.value) || 5)}
                            className="w-full"
                          />
                          <p className="text-xs text-muted-foreground">Chapters/arc (default: 5)</p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="prompt">{storyType === "novel" ? "Novel" : "Story"} Prompt</Label>
                    <Textarea
                      id="prompt"
                      placeholder={
                        storyType === "novel"
                          ? "Describe your novel concept... (e.g., 'A young wizard's journey through magical academies')"
                          : "Describe your story idea... (e.g., 'A detective solves a mysterious case')"
                      }
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  {storyType === "novel" ? (
                    <div className="space-y-2">
                      <Button
                        onClick={handleGenerateOutline}
                        disabled={isGenerating}
                        className="w-full"
                        size="lg"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Creating Outline...
                          </>
                        ) : (
                          <>
                            <BookOpen className="mr-2 h-5 w-5" />
                            Create Novel Chapter-by-Chapter
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Recommended: Generate outline first, then write chapters one by one
                      </p>
                    </div>
                  ) : (
                    <Button onClick={handleGenerate} disabled={isGenerating} className="w-full" size="lg">
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Generate Story
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Generated Content</CardTitle>
                  <CardDescription>Your AI-generated {storyType} will appear here</CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedStory ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                        <div className="space-y-1">
                          {storyTitle && <div className="font-semibold text-sm">{storyTitle}</div>}
                          <div className="text-xs text-muted-foreground">
                            {generatedStory.length} characters • {Math.round(generatedStory.split(/\s+/).length)} words
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSave} size="sm" variant="default">
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
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
                                Download as PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="prose prose-sm max-w-none dark:prose-invert max-h-[600px] overflow-y-auto p-4 bg-muted/20 rounded-lg border">
                        <div className="whitespace-pre-wrap break-words">{generatedStory}</div>
                      </div>
                      <div className="text-xs text-center text-muted-foreground">
                        {storyType === "novel" ? "Novel" : "Story"} generated • {genre} • {tone}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      {isGenerating ? (
                        <div className="text-center space-y-2">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                          <p>Crafting your {storyType}...</p>
                        </div>
                      ) : (
                        <p>Your generated {storyType} will appear here</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main >
    </div >
  )
}
