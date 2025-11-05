"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, BookOpen, Clock, FileText, LogOut, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
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

export default function MyStoriesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    const {
      data: { user: userData },
    } = await supabase.auth.getUser()

    if (!userData) {
      router.push("/auth/login")
      return
    }

    setUser(userData)

    // Fetch user's stories
    const response = await fetch("/api/stories")
    const allStories = await response.json()
    const userStories = allStories.filter((story: any) => story.user_id === userData.id)
    setStories(userStories)
    setLoading(false)
  }

  const handleDeleteStory = async (storyId: string, storyTitle: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

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
        description: `"${storyTitle}" has been permanently deleted.`,
      })

      // Refresh stories list
      loadData()
    } catch (error) {
      console.error("Error deleting story:", error)
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete story.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">StoryForge AI</h1>
          </Link>
          <div className="flex gap-3">
            <Link href="/gallery">
              <Button variant="ghost">Public Gallery</Button>
            </Link>
            <Link href="/generate">
              <Button className="gap-2">
                <Sparkles className="w-4 h-4" />
                Create New
              </Button>
            </Link>
            <form action="/auth/logout" method="post">
              <Button variant="ghost" type="submit" className="gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">My Stories</h2>
            <p className="text-muted-foreground">Your personal collection of AI-generated stories and novels</p>
          </div>

          {stories.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent className="space-y-4">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">No stories yet</h3>
                  <p className="text-muted-foreground mb-4">Start creating your first AI-generated story or novel</p>
                  <Link href="/generate">
                    <Button className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      Generate Your First Story
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <Card key={story.id} className="h-full hover:shadow-lg transition-shadow group relative">
                  <Link href={`/story/${story.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                          {story.title}
                        </CardTitle>
                        {story.story_type === "novel" ? (
                          <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
                        ) : (
                          <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{story.genre}</Badge>
                        <Badge variant="outline">{story.tone}</Badge>
                        <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                          {story.story_type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <CardDescription className="line-clamp-3">
                        {(() => {
                          // For new novels with chapters_data structure
                          if (story.chapters_data) {
                            try {
                              const chaptersData = JSON.parse(story.chapters_data)
                              if (chaptersData.arcs && Array.isArray(chaptersData.arcs)) {
                                const firstChapterWithContent = chaptersData.arcs
                                  .flatMap((arc: any) => arc.chapters || [])
                                  .find((ch: any) => ch.content)
                                if (firstChapterWithContent?.content) {
                                  return firstChapterWithContent.content.substring(0, 150) + '...'
                                }
                              }
                            } catch (e) {
                              console.error('Error parsing chapters_data:', e)
                            }
                          }
                          // For old stories with direct content
                          if (story.content) {
                            return story.content.substring(0, 150) + '...'
                          }
                          return 'Novel in progress...'
                        })()}
                      </CardDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(story.created_at)}</span>
                        </div>
                        <span className="text-xs">{story.word_count} words</span>
                      </div>
                    </CardContent>
                  </Link>
                  <div className="absolute top-2 right-2 z-10">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Story?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{story.title}&quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => handleDeleteStory(story.id, story.title, e)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
