import { createClient } from "@/lib/supabase/server"
import { getUserCredits } from "@/lib/credits"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, Sparkles, ArrowLeft, Check } from "lucide-react"

export default async function CreditsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const userCredits = await getUserCredits(user.id, user.email)

  const creditPackages = [
    {
      name: "Starter Pack",
      credits: 10,
      price: "$4.99",
      popular: false,
    },
    {
      name: "Creator Pack",
      credits: 25,
      price: "$9.99",
      popular: true,
      savings: "Save 20%",
    },
    {
      name: "Author Pack",
      credits: 50,
      price: "$14.99",
      popular: false,
      savings: "Save 40%",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">StoryForge AI</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Purchase Credits</h1>
            <p className="text-xl text-muted-foreground mb-6">Continue creating amazing stories with more credits</p>
            <Card className="inline-block">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Coins className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-3xl font-bold">{userCredits.credits} Credits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {creditPackages.map((pkg) => (
              <Card key={pkg.name} className={pkg.popular ? "border-primary border-2 relative" : ""}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <CardDescription>
                    {pkg.savings && <span className="text-primary font-semibold">{pkg.savings}</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-4xl font-bold">{pkg.price}</p>
                    <p className="text-muted-foreground">{pkg.credits} credits</p>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm">Generate {pkg.credits} stories</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm">Never expires</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm">All genres & tones</span>
                    </li>
                  </ul>
                  <Button className="w-full" variant={pkg.popular ? "default" : "outline"} disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>How Credits Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                • Each short story generation costs 1 credit
              </p>
              <p className="text-muted-foreground">
                • For novels: 1 credit per arc (all chapters in that arc included)
              </p>
              <p className="text-muted-foreground">• Credits never expire and can be used anytime</p>
              <p className="text-muted-foreground">• New users get 15 free credits to start creating immediately</p>
              <p className="text-muted-foreground">• Save more by purchasing larger credit packages</p>
              <p className="text-sm text-primary font-semibold mt-4">
                💡 Credit purchasing will be available soon! For now, enjoy your free credits.
              </p>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">Total stories generated: {userCredits.total_generated}</p>
          </div>
        </div>
      </main>
    </div>
  )
}
