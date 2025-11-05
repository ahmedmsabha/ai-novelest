import { createClient } from "@/lib/supabase/server"
import { getUserCredits } from "@/lib/credits"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ credits: 0, isAnonymous: true })
    }

    const userCredits = await getUserCredits(user.id, user.email)

    return Response.json({
      credits: userCredits.credits,
      totalGenerated: userCredits.total_generated,
      isAnonymous: false,
    })
  } catch (error) {
    console.error("[v0] Error fetching credits:", error)
    return Response.json({ error: "Failed to fetch credits" }, { status: 500 })
  }
}
