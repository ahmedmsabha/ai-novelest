"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
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
    Globe,
    Plus,
    Trash2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import jsPDF from "jspdf"

interface Chapter {
    id: string
    number: number
    title: string
    summary: string
    content?: string
    wordCount?: number
}

interface Arc {
    id: string
    number: number
    title: string
    description: string
    chapters: Chapter[]
}

export default function CreateNovelPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const [rawOutline, setRawOutline] = useState("")
    const [arcs, setArcs] = useState<Arc[]>([])
    const [currentChapter, setCurrentChapter] = useState(0)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    const [novelMetadata, setNovelMetadata] = useState<any>(null)
    const [novelId, setNovelId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Edit states
    const [editingArc, setEditingArc] = useState<string | null>(null)
    const [editingChapter, setEditingChapter] = useState<string | null>(null)
    const [editArcTitle, setEditArcTitle] = useState("")
    const [editArcDescription, setEditArcDescription] = useState("")
    const [editChapterTitle, setEditChapterTitle] = useState("")
    const [editChapterSummary, setEditChapterSummary] = useState("")

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
        const outlineData = searchParams.get("outline") || sessionStorage.getItem("novel_outline")
        const metadata = searchParams.get("metadata") || sessionStorage.getItem("novel_metadata")
        const savedNovelId = sessionStorage.getItem("novel_id")
        const savedArcs = sessionStorage.getItem("novel_arcs")

        if (outlineData) {
            setRawOutline(outlineData)
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

        if (savedArcs) {
            setArcs(JSON.parse(savedArcs))
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
        const parsedArcs: Arc[] = []

        // Find all arcs - Pattern: ## Arc X: Title
        const arcRegex = /##\s*Arc\s*(\d+):\s*(.+?)(?:\n|$)/gi
        const arcMatches = Array.from(outlineText.matchAll(arcRegex))

        console.log(`[parseOutline] Found ${arcMatches.length} arcs`)

        if (arcMatches.length === 0) {
            // No arcs found - create a single default arc
            const chapterRegex = /###\s*Chapter\s*(\d+):\s*(.+?)(?:\n|$)/gi
            const chapterMatches = Array.from(outlineText.matchAll(chapterRegex))

            if (chapterMatches.length > 0) {
                const defaultArc: Arc = {
                    id: `arc-1`,
                    number: 1,
                    title: "Main Story",
                    description: "",
                    chapters: []
                }

                chapterMatches.forEach((match) => {
                    const chapterNumber = parseInt(match[1])
                    const chapterTitle = match[2].trim()

                    const chapterStartIndex = match.index || 0
                    const nextChapterMatch = outlineText.slice(chapterStartIndex + match[0].length).match(/###\s*Chapter\s*\d+:|$/)
                    const nextChapterIndex = nextChapterMatch ? chapterStartIndex + match[0].length + (nextChapterMatch.index || 0) : outlineText.length
                    const chapterSection = outlineText.slice(chapterStartIndex, nextChapterIndex)
                    const summaryMatch = chapterSection.match(/\*\*Summary:\*\*\s*([\s\S]+?)(?=\n\*\*|\n###|$)/)
                    const summary = summaryMatch ? summaryMatch[1].trim() : ""

                    defaultArc.chapters.push({
                        id: `chapter-${chapterNumber}`,
                        number: chapterNumber,
                        title: chapterTitle,
                        summary: summary
                    })
                })

                parsedArcs.push(defaultArc)
            }
        } else {
            // Parse arcs and their chapters
            arcMatches.forEach((arcMatch, arcIndex) => {
                const arcNumber = parseInt(arcMatch[1])
                const arcTitle = arcMatch[2].trim()

                const arcStartIndex = arcMatch.index || 0
                const nextArcMatch = arcMatches[arcIndex + 1]
                const nextArcIndex = nextArcMatch ? nextArcMatch.index || outlineText.length : outlineText.length
                const arcSection = outlineText.slice(arcStartIndex, nextArcIndex)

                const themeMatch = arcSection.match(/\*\*Theme:\*\*\s*(.+?)(?=\n|$)/)
                const goalMatch = arcSection.match(/\*\*Goal:\*\*\s*(.+?)(?=\n|$)/)
                const description = [
                    themeMatch ? `Theme: ${themeMatch[1].trim()}` : '',
                    goalMatch ? `Goal: ${goalMatch[1].trim()}` : ''
                ].filter(Boolean).join(' | ')

                const chapterRegex = /###\s*Chapter\s*(\d+):\s*(.+?)(?:\n|$)/gi
                const chapterMatches = Array.from(arcSection.matchAll(chapterRegex))

                const arc: Arc = {
                    id: `arc-${arcNumber}`,
                    number: arcNumber,
                    title: arcTitle,
                    description: description,
                    chapters: []
                }

                chapterMatches.forEach((chapterMatch) => {
                    const chapterNumber = parseInt(chapterMatch[1])
                    const chapterTitle = chapterMatch[2].trim()

                    const chapterStartIndex = chapterMatch.index || 0
                    const nextChapterMatch = arcSection.slice(chapterStartIndex + chapterMatch[0].length).match(/###\s*Chapter\s*\d+:|$/)
                    const nextChapterIndex = nextChapterMatch ? chapterStartIndex + chapterMatch[0].length + (nextChapterMatch.index || 0) : arcSection.length
                    const chapterSection = arcSection.slice(chapterStartIndex, nextChapterIndex)
                    const summaryMatch = chapterSection.match(/\*\*Summary:\*\*\s*([\s\S]+?)(?=\n\*\*|\n###|$)/)
                    const summary = summaryMatch ? summaryMatch[1].trim() : ""

                    arc.chapters.push({
                        id: `chapter-${chapterNumber}`,
                        number: chapterNumber,
                        title: chapterTitle,
                        summary: summary
                    })
                })

                parsedArcs.push(arc)
            })
        }

        console.log(`[parseOutline] Parsed ${parsedArcs.length} arcs with ${parsedArcs.reduce((sum, arc) => sum + arc.chapters.length, 0)} total chapters`)
        setArcs(parsedArcs)
        sessionStorage.setItem("novel_arcs", JSON.stringify(parsedArcs))
    }

    // Helper functions to work with Arc structure
    const getAllChapters = (): Chapter[] => {
        return arcs.flatMap(arc => arc.chapters)
    }

    const getChapterByIndex = (index: number): { chapter: Chapter; arcId: string } | null => {
        let currentIndex = 0
        for (const arc of arcs) {
            for (const chapter of arc.chapters) {
                if (currentIndex === index) {
                    return { chapter, arcId: arc.id }
                }
                currentIndex++
            }
        }
        return null
    }

    const updateChapter = (arcId: string, chapterId: string, updates: Partial<Chapter>) => {
        setArcs(prevArcs => {
            const updatedArcs = prevArcs.map(arc => {
                if (arc.id === arcId) {
                    return {
                        ...arc,
                        chapters: arc.chapters.map(ch =>
                            ch.id === chapterId ? { ...ch, ...updates } : ch
                        )
                    }
                }
                return arc
            })
            sessionStorage.setItem("novel_arcs", JSON.stringify(updatedArcs))
            return updatedArcs
        })
    }

    // Arc CRUD Functions
    const addArc = () => {
        const newArc: Arc = {
            id: crypto.randomUUID(),
            number: arcs.length + 1,
            title: `Arc ${arcs.length + 1}`,
            description: "",
            chapters: []
        }
        const updatedArcs = [...arcs, newArc]
        setArcs(updatedArcs)
        sessionStorage.setItem("novel_arcs", JSON.stringify(updatedArcs))
    }

    const deleteArc = (arcId: string) => {
        const updatedArcs = arcs
            .filter(arc => arc.id !== arcId)
            .map((arc, index) => ({ ...arc, number: index + 1 }))
        setArcs(updatedArcs)
        sessionStorage.setItem("novel_arcs", JSON.stringify(updatedArcs))
    }

    const updateArcTitle = (arcId: string, title: string, description?: string) => {
        setArcs(prevArcs => {
            const updatedArcs = prevArcs.map(arc =>
                arc.id === arcId
                    ? { ...arc, title, ...(description !== undefined && { description }) }
                    : arc
            )
            sessionStorage.setItem("novel_arcs", JSON.stringify(updatedArcs))
            return updatedArcs
        })
    }

    const addChapter = (arcId: string) => {
        const updatedArcs = arcs.map(arc => {
            if (arc.id === arcId) {
                const newChapter: Chapter = {
                    id: crypto.randomUUID(),
                    number: getAllChapters().length + 1,
                    title: `Chapter ${getAllChapters().length + 1}`,
                    summary: ""
                }
                return { ...arc, chapters: [...arc.chapters, newChapter] }
            }
            return arc
        })
        // Renumber all chapters globally
        let globalNumber = 1
        const renumberedArcs = updatedArcs.map(arc => ({
            ...arc,
            chapters: arc.chapters.map(ch => ({ ...ch, number: globalNumber++ }))
        }))
        setArcs(renumberedArcs)
        sessionStorage.setItem("novel_arcs", JSON.stringify(renumberedArcs))
    }

    const deleteChapter = (arcId: string, chapterId: string) => {
        const updatedArcs = arcs.map(arc => {
            if (arc.id === arcId) {
                return { ...arc, chapters: arc.chapters.filter(ch => ch.id !== chapterId) }
            }
            return arc
        })
        // Renumber all chapters globally
        let globalNumber = 1
        const renumberedArcs = updatedArcs.map(arc => ({
            ...arc,
            chapters: arc.chapters.map(ch => ({ ...ch, number: globalNumber++ }))
        }))
        setArcs(renumberedArcs)
        sessionStorage.setItem("novel_arcs", JSON.stringify(renumberedArcs))
    }

    // Cutoff Detection
    const checkChapterCutoff = (content: string): { hasCutoff: boolean; issue?: string } => {
        if (!content || content.length < 50) return { hasCutoff: false }

        const lastChars = content.slice(-100).trim()
        const lastSentence = lastChars.split(/[.!?؟।]/).pop()?.trim() || ""

        // Check for incomplete endings
        const cutoffPatterns = [
            /[،,]\s*$/,              // Ends with comma
            /\bو\s*$/,               // Arabic: ends with "and"
            /\bأو\s*$/,              // Arabic: ends with "or"
            /\bلكن\s*$/,             // Arabic: ends with "but"
            /\bبل\s*$/,              // Arabic: ends with "but rather"
            /\b(and|or|but|with|to|from|the|a)\s*$/i, // English conjunctions/articles
            /["«]\s*[^"»]*$/,        // Unclosed quote
            /\s+$/,                  // Just whitespace
        ]

        for (const pattern of cutoffPatterns) {
            if (pattern.test(lastChars)) {
                return {
                    hasCutoff: true,
                    issue: `Chapter appears incomplete (ends with: "${lastSentence.slice(-30)}")`
                }
            }
        }

        // Check if last sentence is suspiciously short
        if (lastSentence.length > 0 && lastSentence.length < 10 && !/[.!?؟।]$/.test(lastChars)) {
            return {
                hasCutoff: true,
                issue: `Chapter may be incomplete (last text: "${lastSentence}")`
            }
        }

        return { hasCutoff: false }
    }

    const generateChapter = async (chapterIndex: number) => {
        const result = getChapterByIndex(chapterIndex)
        if (!result) return

        const { chapter, arcId } = result

        setIsConnecting(true)
        setIsGenerating(false)
        setCurrentChapter(chapterIndex)

        try {
            const allChapters = getAllChapters()
            const previousChapters = allChapters.slice(0, chapterIndex)

            const response = await fetch("/api/generate-chapter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    outline: rawOutline,
                    chapterNumber: chapter.number,
                    chapterTitle: chapter.title,
                    chapterSummary: chapter.summary,
                    previousChapters: previousChapters.map(ch => ({ title: ch.title, summary: ch.summary })),
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
                updateChapter(arcId, chapter.id, {
                    content: chapterContent,
                    wordCount: chapterContent.split(/\s+/).length,
                })
            }

            const wordCount = chapterContent.split(/\s+/).length
            console.log(`Chapter ${chapter.number} generated: ${wordCount} words`)

            // Check for cutoff
            const cutoffCheck = checkChapterCutoff(chapterContent)
            if (cutoffCheck.hasCutoff) {
                console.warn("⚠️ Chapter cutoff detected:", cutoffCheck.issue)
                toast({
                    title: "⚠️ Chapter May Be Incomplete",
                    description: cutoffCheck.issue,
                    variant: "destructive",
                })
            }

            // Auto-save progress
            updateChapter(arcId, chapter.id, {
                content: chapterContent,
                wordCount: wordCount,
            })
            sessionStorage.setItem("novel_arcs", JSON.stringify(arcs))

            if (!cutoffCheck.hasCutoff) {
                toast({
                    title: "✅ Chapter Complete!",
                    description: `Chapter ${chapter.number} generated (${wordCount} words)`,
                })
            }

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
            const allChapters = getAllChapters()
            const fullContent = allChapters.map((ch, idx) =>
                `## Chapter ${idx + 1}: ${ch.title}\n\n${ch.content}`
            ).join("\n\n")

            const title = rawOutline.match(/^#\s*(.+)$/m)?.[1] || "Untitled Novel"
            const totalWords = allChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0)

            const payload = {
                title,
                content: fullContent,
                genre: novelMetadata.genre,
                tone: novelMetadata.tone,
                length: novelMetadata.length,
                prompt: novelMetadata.prompt,
                storyType: "novel",
                isPublished: publish,
                outline: rawOutline,
                chaptersData: JSON.stringify(arcs)
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

    const downloadNovelPDF = async () => {
        try {
            const title = rawOutline.match(/^#\s*(.+)$/m)?.[1] || "Untitled Novel"

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

            arcs.forEach(arc => {
                addText(arc.title, 12, true)
                arc.chapters.forEach(ch => {
                    if (ch?.content) {
                        addText(`  Chapter ${ch.number}: ${ch.title}`, 10, false)
                    }
                })
                yPosition += 3
            })

            addPageBreak()

            // Chapters grouped by Arc
            arcs.forEach(arc => {
                // Arc title page
                addText(arc.title, 20, true, 'center')
                if (arc.description) {
                    addText(arc.description, 12, false, 'center')
                }
                yPosition += 10

                // Arc chapters
                arc.chapters.forEach(ch => {
                    if (ch?.content) {
                        addText(`Chapter ${ch.number}`, 18, true, 'center')
                        addText(ch.title, 14, true, 'center')
                        yPosition += 10

                        const cleanContent = formatText(ch.content)
                        addText(cleanContent, 11, false)

                        addPageBreak()
                    }
                })
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

    const allChapters = getAllChapters()
    const completedChapters = allChapters.filter(ch => ch?.content).length
    const progress = (completedChapters / allChapters.length) * 100

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
                            {completedChapters} / {allChapters.length} chapters
                        </div>
                        <Button
                            onClick={downloadNovelPDF}
                            disabled={completedChapters === 0}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">PDF</span>
                        </Button>
                        <Button
                            onClick={() => saveNovel(false)}
                            disabled={completedChapters === 0 || isSaving}
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
                            disabled={completedChapters === 0 || isSaving}
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
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle>Novel Structure</CardTitle>
                                    <Button onClick={addArc} size="sm" className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        Add Arc
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {arcs.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <p className="mb-4">No arcs yet. Click "Add Arc" to create story structure.</p>
                                        </div>
                                    ) : (
                                        <Accordion type="multiple" defaultValue={arcs.map(arc => arc.id)} className="space-y-2">
                                            {arcs.map((arc) => (
                                                <AccordionItem key={arc.id} value={arc.id} className="border rounded-lg">
                                                    <AccordionTrigger className="px-4 hover:no-underline">
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <span className="font-semibold">{arc.title}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                ({arc.chapters.length} chapters)
                                                            </span>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-4 pb-4 space-y-4">
                                                        {/* Arc Title & Description */}
                                                        <div className="space-y-3 bg-muted/30 p-3 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    value={editingArc === arc.id ? editArcTitle : arc.title}
                                                                    onChange={(e) => {
                                                                        setEditingArc(arc.id)
                                                                        setEditArcTitle(e.target.value)
                                                                    }}
                                                                    onBlur={() => {
                                                                        if (editArcTitle) updateArcTitle(arc.id, editArcTitle, arc.description)
                                                                        setEditingArc(null)
                                                                    }}
                                                                    placeholder="Arc title..."
                                                                    className="flex-1"
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => deleteArc(arc.id)}
                                                                    className="shrink-0 text-destructive"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                            <div className="flex items-start gap-2">
                                                                <Textarea
                                                                    value={editingArc === arc.id ? editArcDescription : arc.description}
                                                                    onChange={(e) => {
                                                                        setEditingArc(arc.id)
                                                                        setEditArcDescription(e.target.value)
                                                                    }}
                                                                    onBlur={() => {
                                                                        if (editArcDescription !== undefined) {
                                                                            updateArcTitle(arc.id, arc.title, editArcDescription)
                                                                        }
                                                                        setEditingArc(null)
                                                                    }}
                                                                    placeholder="Arc description/theme..."
                                                                    className="flex-1 min-h-[60px]"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Chapters List */}
                                                        <div className="space-y-2">
                                                            {arc.chapters.map((chapter) => (
                                                                <div key={chapter.id} className="border rounded-lg p-3 space-y-2 bg-card">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-semibold text-muted-foreground shrink-0">
                                                                            Ch {chapter.number}
                                                                        </span>
                                                                        <Input
                                                                            value={editingChapter === chapter.id ? editChapterTitle : chapter.title}
                                                                            onChange={(e) => {
                                                                                setEditingChapter(chapter.id)
                                                                                setEditChapterTitle(e.target.value)
                                                                            }}
                                                                            onBlur={() => {
                                                                                if (editChapterTitle) {
                                                                                    updateChapter(arc.id, chapter.id, { title: editChapterTitle })
                                                                                }
                                                                                setEditingChapter(null)
                                                                            }}
                                                                            placeholder="Chapter title..."
                                                                            className="flex-1 h-8"
                                                                        />
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => deleteChapter(arc.id, chapter.id)}
                                                                            className="shrink-0 text-destructive"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                    <div className="flex items-start gap-2">
                                                                        <Textarea
                                                                            value={editingChapter === chapter.id ? editChapterSummary : chapter.summary}
                                                                            onChange={(e) => {
                                                                                setEditingChapter(chapter.id)
                                                                                setEditChapterSummary(e.target.value)
                                                                            }}
                                                                            onBlur={() => {
                                                                                if (editChapterSummary !== undefined) {
                                                                                    updateChapter(arc.id, chapter.id, { summary: editChapterSummary })
                                                                                }
                                                                                setEditingChapter(null)
                                                                            }}
                                                                            placeholder="Chapter summary..."
                                                                            className="flex-1 min-h-[50px] text-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <Button
                                                                onClick={() => addChapter(arc.id)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full gap-2"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                                Add Chapter
                                                            </Button>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    )}

                                    {/* Add Arc Button - Always visible */}
                                    <Button
                                        onClick={addArc}
                                        variant="outline"
                                        className="w-full gap-2 mt-4"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add New Arc
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="write" className="space-y-6">
                            <div className="grid lg:grid-cols-3 gap-6">
                                {/* Chapter Sidebar with Arc Organization */}
                                <Card className="lg:col-span-1 max-h-[calc(100vh-250px)] overflow-hidden flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Chapters by Arc</CardTitle>
                                    </CardHeader>
                                    <CardContent className="overflow-y-auto flex-1">
                                        {arcs.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <p className="text-sm mb-2">No arcs found</p>
                                                <p className="text-xs">Go to Outline tab to create arcs</p>
                                            </div>
                                        ) : (
                                            <Accordion type="multiple" defaultValue={arcs.map(arc => arc.id)} className="space-y-2">
                                                {arcs.map((arc) => (
                                                    <AccordionItem key={arc.id} value={arc.id} className="border rounded-lg">
                                                        <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold">{arc.title}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    ({arc.chapters.filter(ch => ch.content).length}/{arc.chapters.length})
                                                                </span>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent className="px-2 pb-2 space-y-1">
                                                            {arc.chapters.map((chapter) => {
                                                                const chapterIndex = getAllChapters().findIndex(ch => ch.id === chapter.id)
                                                                return (
                                                                    <button
                                                                        key={chapter.id}
                                                                        onClick={() => {
                                                                            setCurrentChapter(chapterIndex)
                                                                            if (!chapter.content) {
                                                                                generateChapter(chapterIndex)
                                                                            }
                                                                        }}
                                                                        className={`w-full text-left p-2 rounded-md border transition-colors ${currentChapter === chapterIndex
                                                                            ? "bg-primary text-primary-foreground border-primary"
                                                                            : "hover:bg-muted border-border"
                                                                            }`}
                                                                        disabled={isGenerating || isConnecting}
                                                                    >
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="font-medium text-xs">Ch {chapter.number}</div>
                                                                                <div className="text-xs opacity-80 line-clamp-1">{chapter.title}</div>
                                                                            </div>
                                                                            {chapter.content && (
                                                                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                                            )}
                                                                        </div>
                                                                        {chapter.wordCount && (
                                                                            <div className="text-xs mt-1 opacity-70">{chapter.wordCount} words</div>
                                                                        )}
                                                                    </button>
                                                                )
                                                            })}
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Chapter Content Panel */}
                                <Card className="lg:col-span-2">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle>
                                                {(() => {
                                                    const chapter = getAllChapters()[currentChapter]
                                                    return chapter
                                                        ? `Chapter ${chapter.number}: ${chapter.title}`
                                                        : "Select a chapter"
                                                })()}
                                            </CardTitle>
                                            {(() => {
                                                const chapter = getAllChapters()[currentChapter]
                                                return chapter?.content && (
                                                    <Badge variant="secondary">
                                                        {chapter.wordCount} words
                                                    </Badge>
                                                )
                                            })()}
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
                                        ) : isGenerating && getAllChapters()[currentChapter]?.content ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Writing chapter... ({getAllChapters()[currentChapter].wordCount} words)</span>
                                                </div>
                                                <div className="prose prose-lg max-w-none dark:prose-invert">
                                                    <div className="whitespace-pre-wrap leading-relaxed">{formatText(getAllChapters()[currentChapter].content || "")}</div>
                                                </div>
                                            </div>
                                        ) : getAllChapters()[currentChapter]?.content ? (
                                            <div className="prose prose-lg max-w-none dark:prose-invert">
                                                <div className="whitespace-pre-wrap leading-relaxed">{formatText(getAllChapters()[currentChapter].content || "")}</div>
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
                                        {getAllChapters()[currentChapter]?.content && (
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
                                                        const totalChapters = getAllChapters().length
                                                        if (nextChapter < totalChapters) {
                                                            setCurrentChapter(nextChapter)
                                                            if (!getAllChapters()[nextChapter]?.content) {
                                                                generateChapter(nextChapter)
                                                            }
                                                        }
                                                    }}
                                                    disabled={currentChapter === getAllChapters().length - 1}
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
                                        Total Words: {getAllChapters().reduce((sum, ch) => sum + (ch?.wordCount || 0), 0)}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-lg max-w-none dark:prose-invert space-y-12">
                                        {arcs.map((arc) => (
                                            <div key={arc.id}>
                                                <div className="mb-8 pb-4 border-b-2 border-primary/20">
                                                    <h2 className="text-3xl font-bold mb-2">{arc.title}</h2>
                                                    {arc.description && (
                                                        <p className="text-muted-foreground italic">{arc.description}</p>
                                                    )}
                                                </div>
                                                {arc.chapters.map((ch) => ch?.content && (
                                                    <div key={ch.id} className="mb-10">
                                                        <h3 className="text-2xl font-bold mb-4">Chapter {ch.number}: {ch.title}</h3>
                                                        <div className="whitespace-pre-wrap leading-relaxed">{formatText(ch.content)}</div>
                                                    </div>
                                                ))}
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
