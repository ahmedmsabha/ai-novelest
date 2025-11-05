import { getDbConnection } from "./db-connection"

const sql = getDbConnection()

export interface UserCredits {
  user_id: string
  credits: number
  total_generated: number
  created_at: string
  updated_at: string
}

export interface AnonymousUsage {
  session_id: string
  stories_generated: number
  created_at: string
  updated_at: string
}

// Helper to detect network errors
function isNetworkError(error: any): boolean {
  return (
    error?.code === "UND_ERR_CONNECT_TIMEOUT" ||
    error?.code === "ENOTFOUND" ||
    error?.code === "ETIMEDOUT" ||
    error?.code === "ECONNREFUSED" ||
    error?.message?.includes("fetch failed") ||
    error?.message?.includes("Connect Timeout") ||
    error?.message?.includes("network")
  )
}

// Get or create user credits
export async function getUserCredits(userId: string, userEmail?: string): Promise<UserCredits> {
  // Check if credits exist with retry logic
  let attempts = 0
  const maxAttempts = 3

  while (attempts < maxAttempts) {
    try {
      // First, ensure the user exists in the users table
      if (userEmail) {
        try {
          await sql`
            INSERT INTO users (id, email)
            VALUES (${userId}, ${userEmail})
            ON CONFLICT (email) DO UPDATE 
            SET id = EXCLUDED.id
          `
        } catch (error: any) {
          // Ignore duplicate key errors, but check for network errors
          if (error.code !== "23505") {
            if (isNetworkError(error)) {
              throw error // Let retry logic handle it
            }
            console.error("Error creating/updating user record:", error)
          }
        }
      }

      const existing = await sql`
        SELECT * FROM user_credits WHERE user_id = ${userId}
      ` as unknown as UserCredits[]

      if (existing.length > 0) {
        return existing[0]
      }

      // Create new credits record with 3 free credits for new users
      const result = await sql`
        INSERT INTO user_credits (user_id, credits)
        VALUES (${userId}, 3)
        ON CONFLICT (user_id) DO UPDATE
        SET user_id = EXCLUDED.user_id
        RETURNING *
      ` as unknown as UserCredits[]

      // Log the signup bonus
      try {
        await sql`
          INSERT INTO credits_transactions (user_id, amount, transaction_type, description)
          VALUES (${userId}, 3, 'signup', 'Welcome bonus - 3 free stories')
          ON CONFLICT DO NOTHING
        `
      } catch (error) {
        // Non-critical, don't fail the whole operation
        console.error("Error logging signup bonus:", error)
      }

      return result[0]
    } catch (error: any) {
      attempts++
      console.error(`Error in getUserCredits (attempt ${attempts}/${maxAttempts}):`, error.message || error)
      
      if (attempts >= maxAttempts) {
        // Return default credits after all retries fail
        console.error("All retry attempts failed, returning default credits")
        return {
          user_id: userId,
          credits: 3,
          total_generated: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }
      
      // Exponential backoff: 1s, 2s, 3s
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempts))
    }
  }

  // Fallback default credits
  return {
    user_id: userId,
    credits: 3,
    total_generated: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// Check if user has credits
export async function hasCredits(userId: string, userEmail?: string): Promise<boolean> {
  try {
    const credits = await getUserCredits(userId, userEmail)
    return credits.credits > 0
  } catch (error) {
    console.error("Error checking credits:", error)
    return false
  }
}

// Deduct credits from user
export async function deductCredit(userId: string): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE user_credits
      SET credits = credits - 1,
          total_generated = total_generated + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND credits > 0
      RETURNING *
    ` as unknown as UserCredits[]

    if (result.length > 0) {
      // Log transaction
      await sql`
        INSERT INTO credits_transactions (user_id, amount, transaction_type, description)
        VALUES (${userId}, -1, 'usage', 'Story generation')
      `
      return true
    }
    return false
  } catch (error) {
    console.error("Error deducting credit:", error)
    return false
  }
}

// Add credits to user (for purchases)
export async function addCredits(userId: string, amount: number, description = "Credit purchase"): Promise<void> {
  try {
    await sql`
      UPDATE user_credits
      SET credits = credits + ${amount},
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `

    await sql`
      INSERT INTO credits_transactions (user_id, amount, transaction_type, description)
      VALUES (${userId}, ${amount}, 'purchase', ${description})
    `
  } catch (error) {
    console.error("Error adding credits:", error)
    throw error
  }
}

// Anonymous user functions
export async function getAnonymousUsage(sessionId: string): Promise<AnonymousUsage | null> {
  try {
    const result = await sql`
      SELECT * FROM anonymous_usage
      WHERE session_id = ${sessionId}
    ` as unknown as AnonymousUsage[]
    return result[0] || null
  } catch (error) {
    console.error("Error getting anonymous usage:", error)
    return null
  }
}

export async function canGenerateAnonymous(sessionId: string): Promise<boolean> {
  try {
    const usage = await getAnonymousUsage(sessionId)
    return !usage || usage.stories_generated < 1
  } catch (error) {
    console.error("Error checking anonymous generation:", error)
    return false
  }
}

export async function trackAnonymousGeneration(sessionId: string): Promise<boolean> {
  try {
    const usage = await getAnonymousUsage(sessionId)

    if (usage) {
      await sql`
        UPDATE anonymous_usage
        SET stories_generated = stories_generated + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ${sessionId}
      `
    } else {
      await sql`
        INSERT INTO anonymous_usage (session_id, stories_generated)
        VALUES (${sessionId}, 1)
      `
    }

    return true
  } catch (error) {
    console.error("Error tracking anonymous generation:", error)
    return false
  }
}
