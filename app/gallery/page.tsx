"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, BookOpen, Clock, FileText, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"

export default function GalleryPage() {
  const [stories, setStories] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [filter, setFilter] = useState<"all" | "stories" | "novels">("all")

  useEffect(() => {
    async function loadData() {
      // Fetch stories
      const response = await fetch("/api/stories")
      const data = await response.json()
      setStories(data)

      // Get user
      const supabase = createClient()
      const { data: { user: userData } } = await supabase.auth.getUser()
      setUser(userData)
    }
    loadData()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const filteredStories = stories.filter((story) => {
    if (filter === "stories") return story.story_type === "story"
    if (filter === "novels") return story.story_type === "novel"
    return true
  })

  const storyCount = stories.filter(s => s.story_type === "story").length
  const novelCount = stories.filter(s => s.story_type === "novel").length

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">StoryForge AI</h1>
          </Link>
          <div className="flex gap-3">
            {user && (
              <Link href="/my-stories">
                <Button variant="ghost">My Stories</Button>
              </Link>
            )}
            <Link href={user ? "/generate" : "/auth/sign-up"}>
              <Button className="gap-2">
                <Sparkles className="w-4 h-4" />
                {user ? "Create" : "Sign Up"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Public Gallery</h2>
            <p className="text-muted-foreground">Explore stories and novels created by our community</p>
          </div>

          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">
                All ({stories.length})
              </TabsTrigger>
              <TabsTrigger value="stories">
                <FileText className="w-4 h-4 mr-2" />
                Stories ({storyCount})
              </TabsTrigger>
              <TabsTrigger value="novels">
                <BookOpen className="w-4 h-4 mr-2" />
                Novels ({novelCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredStories.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent className="space-y-4">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {filter === "all" ? "No stories yet" : `No ${filter} yet`}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {filter === "all"
                      ? "Be the first to create an AI-generated story"
                      : `Be the first to create a ${filter.slice(0, -1)}`}
                  </p>
                  <Link href={user ? "/generate" : "/auth/sign-up"}>
                    <Button className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      {user ? "Generate Story" : "Sign Up to Create"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.map((story) => {
                const isOwnStory = user && story.user_id === user.id
                return (
                  <Link key={story.id} href={`/story/${story.id}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group relative">
                      {isOwnStory && (
                        <div className="absolute top-3 right-3 z-10">
                          <Badge variant="default" className="bg-primary text-primary-foreground">
                            <User className="w-3 h-3 mr-1" />
                            Your {story.story_type}
                          </Badge>
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors pr-20">
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
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <CardDescription className="line-clamp-3">{story.preview || story.content?.substring(0, 150)}...</CardDescription>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(story.created_at)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
