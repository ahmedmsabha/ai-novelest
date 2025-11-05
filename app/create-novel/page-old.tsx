"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    ArrowLeft,
    Loader2,
    BookOpen,
    ChevronRight,
    ChevronLeft,
    Save,
    FileText,
    CheckCircle2,
    Download,
    Edit,
    Eye,
    Globe
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import jsPDF from "jspdf"

export default function CreateNovelPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const [outline, setOutline] = useState("")
    const [editableOutline, setEditableOutline] = useState("")
    const [isEditingOutline, setIsEditingOutline] = useState(false)
    const [chapters, setChapters] = useState<Array<{ title: string; content: string; wordCount: number }>>([])
    const [currentChapter, setCurrentChapter] = useState(0)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [novelMetadata, setNovelMetadata] = useState<any>(null)
    const [chapterList, setChapterList] = useState<Array<{ number: number; title: string; summary: string; section?: string }>>([])
    const [novelId, setNovelId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Helper function to format text by removing markdown
    const formatText = (text: string) => {
        return text
            // Remove markdown headers (##, ###, etc)
            .replace(/^#{1,6}\s+/gm, '')
            // Remove bold (**text**)
            .replace(/\*\*(.+?)\*\*/g, '$1')
            // Remove italic (*text*)
            .replace(/\*(.+?)\*/g, '$1')
            // Clean up extra whitespace
            .replace(/\n{3,}/g, '\n\n')
            .trim()
    }

    useEffect(() => {
        // Get outline from URL params or session storage
        const outlineData = searchParams.get("outline") || sessionStorage.getItem("novel_outline")
        const metadata = searchParams.get("metadata") || sessionStorage.getItem("novel_metadata")
        const savedNovelId = sessionStorage.getItem("novel_id")
        const savedChapters = sessionStorage.getItem("novel_chapters")

        if (outlineData) {
            setOutline(outlineData)
            setEditableOutline(outlineData)
            sessionStorage.setItem("novel_outline", outlineData)
            parseOutline(outlineData)
        }

        if (metadata) {
            setNovelMetadata(JSON.parse(metadata))
            sessionStorage.setItem("novel_metadata", metadata)
        }

        if (savedNovelId) {
            setNovelId(savedNovelId)
        }

        if (savedChapters) {
            setChapters(JSON.parse(savedChapters))
        }

        if (!outlineData && !metadata) {
            toast({
                title: "No outline found",
                description: "Please generate an outline first.",
                variant: "destructive",
            })
            router.push("/generate")
        }
    }, [])

    const parseOutline = (outlineText: string) => {
        // Extract chapter information from outline - try multiple patterns

        // Pattern 1: ### Chapter X: Title format
        let chapterRegex = /###\s*Chapter\s*(\d+):\s*(.+?)(?:\n|$)/g
        let matches = Array.from(outlineText.matchAll(chapterRegex))

        // Pattern 2: ## Chapter X: Title format (if pattern 1 didn't work)
        if (matches.length === 0) {
            chapterRegex = /##\s*Chapter\s*(\d+):\s*(.+?)(?:\n|$)/g
            matches = Array.from(outlineText.matchAll(chapterRegex))
        }

        // Extract sections/acts
        const sectionMatches = outlineText.matchAll(/\*\*Act\s+(\d+)[^:]*:\s*([^*]+)\*\*/g)
        const sections = Array.from(sectionMatches).map(match => ({
            act: parseInt(match[1]),
            description: match[2].trim()
        }))

        const parsedChapters = matches.map((match) => {
            const chapterNumber = parseInt(match[1])
            const chapterTitle = match[2].trim()

            // Try to extract summary - look for text after "Summary:" or after the title
            const chapterStartIndex = match.index || 0
            const nextChapterMatch = outlineText.slice(chapterStartIndex + match[0].length).match(/###?\s*Chapter\s*\d+:|$/)
            const nextChapterIndex = nextChapterMatch ? chapterStartIndex + match[0].length + (nextChapterMatch.index || 0) : outlineText.length
            const chapterSection = outlineText.slice(chapterStartIndex, nextChapterIndex)

            // Extract summary
            const summaryMatch = chapterSection.match(/\*\*Summary:\*\*\s*(.+?)(?=\n\*\*|\n###|\n##|$)/)
            const summary = summaryMatch ? summaryMatch[1].trim() : chapterTitle

            // Determine section based on chapter number
            let section = "Main Story"
            if (sections.length > 0) {
                const totalChapters = matches.length
                const chaptersPerAct = Math.ceil(totalChapters / sections.length)
                const actIndex = Math.floor((chapterNumber - 1) / chaptersPerAct)
                if (sections[actIndex]) {
                    section = `Act ${sections[actIndex].act}: ${sections[actIndex].description}`
                }
            }

            return {
                number: chapterNumber,
                title: chapterTitle,
                summary: summary,
                section: section
            }
        })

        console.log(`[parseOutline] Found ${parsedChapters.length} chapters`)

        if (parsedChapters.length === 0) {
            toast({
                title: "Outline parsing issue",
                description: "Could not find chapters in the outline. The outline may need manual formatting.",
                variant: "destructive",
            })
        }

        setChapterList(parsedChapters)
    }

    const handleSaveOutline = () => {
        setOutline(editableOutline)
        sessionStorage.setItem("novel_outline", editableOutline)
        parseOutline(editableOutline)
        setIsEditingOutline(false)
        toast({
            title: "Outline updated!",
            description: "Your changes have been saved.",
        })
    }

    const generateChapter = async (chapterIndex: number) => {
        if (!chapterList[chapterIndex]) return

        setIsConnecting(true)
        setIsGenerating(false)
        setCurrentChapter(chapterIndex)

        const chapter = chapterList[chapterIndex]

        try {
            const response = await fetch("/api/generate-chapter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    outline,
                    chapterNumber: chapter.number,
                    chapterTitle: chapter.title,
                    chapterSummary: chapter.summary,
                    previousChapters: chapters.map((ch) => ({ summary: ch.title })),
                    ...novelMetadata,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to generate chapter")
            }

            // Connection established, now streaming
            setIsConnecting(false)
            setIsGenerating(true)

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) {
                throw new Error("No response body")
            }

            let chapterContent = ""

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                chapterContent += chunk

                // Update real-time preview
                const updatedChapters = [...chapters]
                updatedChapters[chapterIndex] = {
                    title: chapter.title,
                    content: chapterContent,
                    wordCount: chapterContent.split(/\s+/).length,
                }
                setChapters(updatedChapters)
            }

            const wordCount = chapterContent.split(/\s+/).length
            console.log(`Chapter ${chapter.number} generated: ${wordCount} words`)

            // Auto-save progress
            const updatedChapters = [...chapters]
            updatedChapters[chapterIndex] = {
                title: chapter.title,
                content: chapterContent,
                wordCount: wordCount,
            }
            setChapters(updatedChapters)
            sessionStorage.setItem("novel_chapters", JSON.stringify(updatedChapters))

            toast({
                title: "Chapter Complete!",
                description: `Chapter ${chapter.number} generated (${wordCount} words)`,
            })

            setIsGenerating(false)
            setIsConnecting(false)
        } catch (error) {
            console.error("Error generating chapter:", error)
            toast({
                title: "Generation Failed",
                description: "Failed to generate chapter. Please try again.",
                variant: "destructive",
            })
            setIsGenerating(false)
            setIsConnecting(false)
        }
    }

    const saveNovel = async (publish: boolean = false) => {
        setIsSaving(true)
        try {
            const fullContent = chapters.map((ch, idx) =>
                `## Chapter ${idx + 1}: ${ch.title}\n\n${ch.content}`
            ).join("\n\n")

            const title = outline.match(/^#\s*(.+)$/m)?.[1] || "Untitled Novel"
            const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0)

            const payload = {
                title,
                content: fullContent,
                genre: novelMetadata.genre,
                tone: novelMetadata.tone,
                length: novelMetadata.length,
                prompt: novelMetadata.prompt,
                storyType: "novel",
                isPublished: publish,
                outline: outline,
                chaptersData: JSON.stringify(chapters.map((ch, idx) => ({
                    number: idx + 1,
                    title: ch.title,
                    content: ch.content,
                    wordCount: ch.wordCount
                })))
            }

            let response
            if (novelId) {
                // Update existing novel
                response = await fetch(`/api/stories/${novelId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })
            } else {
                // Create new novel
                response = await fetch("/api/stories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })
            }

            if (!response.ok) {
                throw new Error("Failed to save novel")
            }

            const { id } = await response.json()
            setNovelId(id)
            sessionStorage.setItem("novel_id", id)

            toast({
                title: publish ? "Novel Published!" : "Novel Saved!",
                description: publish
                    ? `Your novel (${totalWords} words) is now public and ready to read!`
                    : `Your novel (${totalWords} words) has been saved as a draft.`,
            })

            if (publish) {
                router.push(`/story/${id}`)
            }
        } catch (error) {
            console.error("Error saving novel:", error)
            toast({
                title: "Save Failed",
                description: "Failed to save novel. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    const downloadNovelPDF = () => {
        try {
            const title = outline.match(/^#\s*(.+)$/m)?.[1] || "Untitled Novel"

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            })

            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()
            const margin = 25
            const maxWidth = pageWidth - (margin * 2)
            let yPosition = margin

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

            const addPageBreak = () => {
                pdf.addPage()
                yPosition = margin
            }

            // Title Page
            yPosition = pageHeight / 3
            addText(title, 28, true, 'center')
            yPosition += 10
            addText(`A Novel`, 14, false, 'center')
            yPosition += 5
            addText(`Genre: ${novelMetadata?.genre || 'Fiction'}`, 10, false, 'center')

            addPageBreak()

            // Table of Contents
            addText("Table of Contents", 20, true)
            yPosition += 5

            const groupedChapters: { [key: string]: typeof chapterList } = {}
            chapterList.forEach(ch => {
                const section = ch.section || "Main Story"
                if (!groupedChapters[section]) {
                    groupedChapters[section] = []
                }
                groupedChapters[section].push(ch)
            })

            Object.entries(groupedChapters).forEach(([section, chaps]) => {
                addText(section, 12, true)
                chaps.forEach(ch => {
                    if (chapters[ch.number - 1]?.content) {
                        addText(`  Chapter ${ch.number}: ${ch.title}`, 10, false)
                    }
                })
                yPosition += 3
            })

            addPageBreak()

            // Chapters
            chapters.forEach((ch, idx) => {
                if (ch?.content) {
                    addText(`Chapter ${idx + 1}`, 18, true, 'center')
                    addText(ch.title, 14, true, 'center')
                    yPosition += 10

                    const cleanContent = formatText(ch.content)
                    addText(cleanContent, 11, false)

                    addPageBreak()
                }
            })

            pdf.save(`${title}.pdf`)

            toast({
                title: "PDF Downloaded!",
                description: "Your novel has been downloaded as a professional PDF.",
            })
        } catch (error) {
            console.error("Error generating PDF:", error)
            toast({
                title: "PDF generation failed",
                description: "Failed to generate PDF. Please try again.",
                variant: "destructive",
            })
        }
    }

    const progress = (chapters.filter(ch => ch?.content).length / chapterList.length) * 100

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/generate">
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-muted-foreground hidden sm:block">
                            {chapters.filter(ch => ch?.content).length} / {chapterList.length} chapters
                        </div>
                        <Button
                            onClick={downloadNovelPDF}
                            disabled={chapters.filter(ch => ch?.content).length === 0}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">PDF</span>
                        </Button>
                        <Button
                            onClick={() => saveNovel(false)}
                            disabled={chapters.filter(ch => ch?.content).length === 0 || isSaving}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">Save Draft</span>
                        </Button>
                        <Button
                            onClick={() => saveNovel(true)}
                            disabled={chapters.filter(ch => ch?.content).length === 0 || isSaving}
                            size="sm"
                            className="gap-2"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Globe className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">Publish</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold mb-2">Create Your Novel</h1>
                        <Progress value={progress} className="h-2" />
                    </div>

                    <Tabs defaultValue="write" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="outline">Outline</TabsTrigger>
                            <TabsTrigger value="write">Write Chapters</TabsTrigger>
                            <TabsTrigger value="preview">Preview Novel</TabsTrigger>
                        </TabsList>

                        <TabsContent value="outline">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                    <CardTitle>Novel Outline</CardTitle>
                                    <Dialog open={isEditingOutline} onOpenChange={setIsEditingOutline}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="gap-2">
                                                <Edit className="w-4 h-4" />
                                                Edit Outline
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl max-h-[80vh]">
                                            <DialogHeader>
                                                <DialogTitle>Edit Novel Outline</DialogTitle>
                                                <DialogDescription>
                                                    Modify your outline to adjust chapter structure and content before generating.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <Textarea
                                                value={editableOutline}
                                                onChange={(e) => setEditableOutline(e.target.value)}
                                                className="min-h-[400px] font-mono text-sm"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" onClick={() => setIsEditingOutline(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleSaveOutline}>
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-lg max-w-none dark:prose-invert">
                                        <div className="whitespace-pre-wrap leading-relaxed">{formatText(outline)}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="write" className="space-y-6">
                            <div className="grid lg:grid-cols-3 gap-6">
                                {/* Chapter List */}
                                <Card className="lg:col-span-1 max-h-[calc(100vh-250px)] overflow-hidden flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Chapters</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 overflow-y-auto flex-1">
                                        {chapterList.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <p className="text-sm mb-2">No chapters found in outline</p>
                                                <p className="text-xs">Check the Outline tab to see the generated content</p>
                                            </div>
                                        ) : (
                                            Object.entries(
                                                chapterList.reduce((acc, chapter) => {
                                                    const section = chapter.section || "Main Story"
                                                    if (!acc[section]) acc[section] = []
                                                    acc[section].push(chapter)
                                                    return acc
                                                }, {} as Record<string, typeof chapterList>)
                                            ).map(([section, sectionChapters]) => (
                                                <div key={section} className="mb-4">
                                                    <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wide">
                                                        {section}
                                                    </h3>
                                                    <div className="space-y-2">
                                                        {sectionChapters.map((chapter, idx) => {
                                                            const chapterIndex = chapterList.findIndex(ch => ch.number === chapter.number)
                                                            return (
                                                                <button
                                                                    key={chapter.number}
                                                                    onClick={() => {
                                                                        setCurrentChapter(chapterIndex)
                                                                        if (!chapters[chapterIndex]?.content) {
                                                                            generateChapter(chapterIndex)
                                                                        }
                                                                    }}
                                                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${currentChapter === chapterIndex
                                                                        ? "bg-primary text-primary-foreground border-primary"
                                                                        : "hover:bg-muted border-border"
                                                                        }`}
                                                                    disabled={isGenerating || isConnecting}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex-1">
                                                                            <div className="font-semibold text-sm">Chapter {chapter.number}</div>
                                                                            <div className="text-xs opacity-80 line-clamp-1">{chapter.title}</div>
                                                                        </div>
                                                                        {chapters[chapterIndex]?.content && (
                                                                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                                        )}
                                                                    </div>
                                                                    {chapters[chapterIndex]?.wordCount && (
                                                                        <div className="text-xs mt-1 opacity-70">{chapters[chapterIndex].wordCount} words</div>
                                                                    )}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Chapter Content */}
                                <Card className="lg:col-span-2">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle>
                                                {chapterList[currentChapter] ?
                                                    `Chapter ${chapterList[currentChapter].number}: ${chapterList[currentChapter].title}`
                                                    : "Select a chapter"}
                                            </CardTitle>
                                            {chapters[currentChapter]?.content && (
                                                <Badge variant="secondary">
                                                    {chapters[currentChapter].wordCount} words
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {isConnecting ? (
                                            <div className="flex items-center justify-center py-12">
                                                <div className="text-center space-y-4">
                                                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                                                    <p className="text-muted-foreground">Connecting to AI...</p>
                                                    <p className="text-xs text-muted-foreground">Preparing to generate chapter</p>
                                                </div>
                                            </div>
                                        ) : isGenerating && chapters[currentChapter]?.content ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Writing chapter... ({chapters[currentChapter].wordCount} words)</span>
                                                </div>
                                                <div className="prose prose-lg max-w-none dark:prose-invert">
                                                    <div className="whitespace-pre-wrap leading-relaxed">{formatText(chapters[currentChapter].content)}</div>
                                                </div>
                                            </div>
                                        ) : chapters[currentChapter]?.content ? (
                                            <div className="prose prose-lg max-w-none dark:prose-invert">
                                                <div className="whitespace-pre-wrap leading-relaxed">{formatText(chapters[currentChapter].content)}</div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                                <p className="text-muted-foreground mb-4">
                                                    Click "Generate Chapter" to write this chapter
                                                </p>
                                                <Button onClick={() => generateChapter(currentChapter)} disabled={isGenerating || isConnecting}>
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    Generate Chapter
                                                </Button>
                                            </div>
                                        )}

                                        {/* Navigation */}
                                        {chapters[currentChapter]?.content && (
                                            <div className="flex justify-between mt-6 pt-6 border-t">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setCurrentChapter(Math.max(0, currentChapter - 1))}
                                                    disabled={currentChapter === 0}
                                                >
                                                    <ChevronLeft className="w-4 h-4 mr-2" />
                                                    Previous
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        const nextChapter = currentChapter + 1
                                                        if (nextChapter < chapterList.length) {
                                                            setCurrentChapter(nextChapter)
                                                            if (!chapters[nextChapter]?.content) {
                                                                generateChapter(nextChapter)
                                                            }
                                                        }
                                                    }}
                                                    disabled={currentChapter === chapterList.length - 1}
                                                >
                                                    Next Chapter
                                                    <ChevronRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="preview">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Full Novel Preview</CardTitle>
                                    <div className="text-sm text-muted-foreground">
                                        Total Words: {chapters.reduce((sum, ch) => sum + (ch?.wordCount || 0), 0)}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-lg max-w-none dark:prose-invert">
                                        {chapters.map((ch, idx) => ch?.content && (
                                            <div key={idx} className="mb-12">
                                                <h2 className="text-2xl font-bold mb-4">Chapter {idx + 1}: {ch.title}</h2>
                                                <div className="whitespace-pre-wrap leading-relaxed">{formatText(ch.content)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main >
        </div >
    )
}
