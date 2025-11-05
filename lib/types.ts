/**
 * Type definitions for the application
 */

export interface Story {
    id: string
    title: string
    content: string
    prompt: string
    genre: string
    tone: string
    word_count: number
    user_id: string | null
    story_type: 'story' | 'novel'
    created_at: string
}

export interface User {
    id: string
    email: string
    created_at: string
}

export interface UserCredits {
    user_id: string
    credits: number
    total_generated: number
    created_at: string
    updated_at: string
}

export interface AnonymousUsage {
    session_id: string
    generations_count: number
    created_at: string
    last_used_at: string
}

export interface CreditTransaction {
    id: string
    user_id: string
    amount: number
    transaction_type: 'purchase' | 'usage' | 'signup' | 'refund'
    description: string
    created_at: string
}

export type StoryType = 'story' | 'novel'

export type Genre =
    | 'fantasy'
    | 'scifi'
    | 'mystery'
    | 'romance'
    | 'horror'
    | 'adventure'
    | 'thriller'
    | 'comedy'

export type Tone =
    | 'adventurous'
    | 'dark'
    | 'humorous'
    | 'mysterious'
    | 'romantic'
    | 'suspenseful'
    | 'whimsical'
    | 'dramatic'

export type StoryLength = 'short' | 'medium' | 'long'

export interface GenerateStoryParams {
    prompt: string
    genre: Genre
    tone: Tone
    storyType: StoryType
    length: StoryLength
}
