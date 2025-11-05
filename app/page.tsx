import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, BookOpen, Zap, User, LogIn } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">StoryForge AI</h1>
          </div>
          <nav className="flex gap-3">
            <Link href="/gallery">
              <Button variant="ghost">Gallery</Button>
            </Link>
            {user ? (
              <>
                <Link href="/my-stories">
                  <Button variant="ghost">My Stories</Button>
                </Link>
                <Link href="/generate">
                  <Button className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Create
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button className="gap-2">
                    <User className="w-4 h-4" />
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-background py-24 md:py-32 lg:py-40">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
          <div className="container mx-auto px-4 text-center relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
              <Zap className="w-4 h-4" />
              Powered by Google Gemini AI
            </div>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance">
              Craft Stories & Novels
              <br />
              <span className="text-primary">With AI Magic</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
              Transform your ideas into captivating narratives. Generate short stories or full-length novels with
              advanced AI technology.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              {user ? (
                <Link href="/generate">
                  <Button size="lg" className="gap-2 text-lg px-8 h-12">
                    <Sparkles className="w-5 h-5" />
                    Start Creating
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/sign-up">
                  <Button size="lg" className="gap-2 text-lg px-8 h-12">
                    <Sparkles className="w-5 h-5" />
                    Get Started Free
                  </Button>
                </Link>
              )}
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 h-12 bg-transparent">
                  <BookOpen className="w-5 h-5" />
                  Explore Gallery
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-card/30">
          <div className="container mx-auto px-4">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-12">Create Your Way</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold mx-auto">
                  📖
                </div>
                <h4 className="text-xl font-semibold">Short Stories</h4>
                <p className="text-muted-foreground text-sm">
                  Quick, engaging tales perfect for a single sitting. 300-1000 words of pure creativity.
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold mx-auto">
                  📚
                </div>
                <h4 className="text-xl font-semibold">Full Novels</h4>
                <p className="text-muted-foreground text-sm">
                  Epic narratives with depth and complexity. Multi-chapter stories that captivate readers.
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold mx-auto">
                  🎨
                </div>
                <h4 className="text-xl font-semibold">Your Style</h4>
                <p className="text-muted-foreground text-sm">
                  Choose genre, tone, and style. From fantasy to sci-fi, humorous to dramatic.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h3 className="text-2xl md:text-3xl font-bold">Your Personal Library</h3>
              <p className="text-muted-foreground text-lg">
                Create an account to save your stories, build your collection, and share your creations with the
                community.
              </p>
              {!user && (
                <Link href="/auth/sign-up">
                  <Button size="lg" className="gap-2">
                    <User className="w-5 h-5" />
                    Create Free Account
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 bg-card/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Built with Next.js, Google Gemini AI, Supabase Auth, and Neon PostgreSQL</p>
        </div>
      </footer>
    </div>
  )
}
