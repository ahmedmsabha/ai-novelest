import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, User, LogIn, LogOut, UserCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
        <nav className="flex gap-3 items-center">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <UserCircle className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Account</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/credits" className="cursor-pointer">
                      Credits
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-stories" className="cursor-pointer">
                      My Stories
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action="/auth/logout" method="post" className="w-full">
                      <button type="submit" className="flex w-full items-center gap-2 text-left">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
