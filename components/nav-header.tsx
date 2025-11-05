import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, User, LogIn, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export async function NavHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">StoryForge AI</h1>
        </Link>
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
              <form action="/auth/logout" method="post">
                <Button variant="ghost" type="submit" className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </form>
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
  )
}
