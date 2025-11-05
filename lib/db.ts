import { getDbConnection } from "./db-connection"

const sql = getDbConnection()

export interface Story {
  id: string
  title: string
  content: string
  prompt: string
  genre: string
  tone: string
  word_count: number
  user_id: string | null
  story_type: "story" | "novel"
  created_at: string
  is_published?: boolean
  outline?: string | null
  chapters_data?: string | null
}

export async function getAllStories(): Promise<Story[]> {
  try {
    let attempts = 0
    const maxAttempts = 3
    
    while (attempts < maxAttempts) {
      try {
        const stories = await sql`
          SELECT * FROM stories 
          WHERE is_public = true
          ORDER BY created_at DESC
          LIMIT 100
        `
        return stories as Story[]
      } catch (error: any) {
        attempts++
        if (error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' && attempts < maxAttempts) {
          console.log(`[db] Connection timeout, retrying (${attempts}/${maxAttempts})...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
          continue
        }
        throw error
      }
    }
    return []
  } catch (error) {
    console.error("[db] Error getting all stories:", error)
    return []
  }
}

export async function getStoriesByUser(userId: string): Promise<Story[]> {
  try {
    let attempts = 0
    const maxAttempts = 3
    
    while (attempts < maxAttempts) {
      try {
        const stories = await sql`
          SELECT * FROM stories 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `
        return stories as Story[]
      } catch (error: any) {
        attempts++
        if (error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' && attempts < maxAttempts) {
          console.log(`[db] Connection timeout, retrying (${attempts}/${maxAttempts})...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
          continue
        }
        throw error
      }
    }
    return []
  } catch (error) {
    console.error("[db] Error getting user stories:", error)
    return []
  }
}

export async function getStoryById(id: string): Promise<Story | null> {
  try {
    // Retry logic for connection timeouts
    let attempts = 0
    const maxAttempts = 3
    let lastError: any = null

    while (attempts < maxAttempts) {
      try {
        const stories = await sql`
          SELECT * FROM stories 
          WHERE id = ${id}
          LIMIT 1
        `
        return (stories[0] as Story) || null
      } catch (error: any) {
        lastError = error
        attempts++
        
        // Check if it's a connection timeout error
        if (error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' && attempts < maxAttempts) {
          console.log(`[db] Connection timeout, retrying (${attempts}/${maxAttempts})...`)
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
          continue
        }
        
        throw error
      }
    }

    throw lastError
  } catch (error) {
    console.error("[db] Error getting story by id:", error)
    return null
  }
}

export async function createStory(story: Omit<Story, "id" | "created_at"> & { user_id: string }): Promise<Story> {
  try {
    const result = await sql`
      INSERT INTO stories (title, content, prompt, genre, tone, word_count, user_id, story_type)
      VALUES (${story.title}, ${story.content}, ${story.prompt}, ${story.genre}, ${story.tone}, ${story.word_count}, ${story.user_id}, ${story.story_type})
      RETURNING *
    `
    return result[0] as Story
  } catch (error) {
    console.error("Error creating story:", error)
    throw error
  }
}

export interface User {
  id: string
  email: string
  created_at: string
}

export async function createUser(id: string, email: string): Promise<User> {
  try {
    const result = await sql`
      INSERT INTO users (id, email)
      VALUES (${id}, ${email})
      ON CONFLICT (id) DO NOTHING
      RETURNING *
    `
    return result[0] as User
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE id = ${id}
    `
    return (result[0] as User) || null
  } catch (error) {
    console.error("Error getting user by id:", error)
    return null
  }
}
