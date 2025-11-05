/**
 * Constants used throughout the application
 */

export const GENRES = [
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'scifi', label: 'Sci-Fi' },
    { value: 'mystery', label: 'Mystery' },
    { value: 'romance', label: 'Romance' },
    { value: 'horror', label: 'Horror' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'thriller', label: 'Thriller' },
    { value: 'comedy', label: 'Comedy' },
] as const

export const TONES = [
    { value: 'adventurous', label: 'Adventurous' },
    { value: 'dark', label: 'Dark' },
    { value: 'humorous', label: 'Humorous' },
    { value: 'mysterious', label: 'Mysterious' },
    { value: 'romantic', label: 'Romantic' },
    { value: 'suspenseful', label: 'Suspenseful' },
    { value: 'whimsical', label: 'Whimsical' },
    { value: 'dramatic', label: 'Dramatic' },
] as const

export const STORY_TYPES = [
    { value: 'story', label: 'Short Story', description: '300-1000 words' },
    { value: 'novel', label: 'Novel', description: '1500-5000+ words' },
] as const

export const STORY_LENGTHS = [
    {
        value: 'short',
        label: 'Short',
        storyWords: '300-500',
        novelWords: '1500-2500',
        novelArcs: 2,
        novelChaptersPerArc: 4,
        novelTotalChapters: 8,
        novelDescription: '2 arcs × 4 chapters = 8 chapters'
    },
    {
        value: 'medium',
        label: 'Medium',
        storyWords: '500-750',
        novelWords: '2500-4000',
        novelArcs: 3,
        novelChaptersPerArc: 5,
        novelTotalChapters: 15,
        novelDescription: '3 arcs × 5 chapters = 15 chapters'
    },
    {
        value: 'long',
        label: 'Long',
        storyWords: '750-1000',
        novelWords: '4000-5000+',
        novelArcs: 3,
        novelChaptersPerArc: 8,
        novelTotalChapters: 24,
        novelDescription: '3 arcs × 8 chapters = 24 chapters'
    },
] as const

export const NOVEL_DEFAULTS = {
    short: { arcs: 2, chaptersPerArc: 4, totalChapters: 8 },
    medium: { arcs: 3, chaptersPerArc: 5, totalChapters: 15 },
    long: { arcs: 3, chaptersPerArc: 8, totalChapters: 24 },
} as const

export const CREDITS = {
    SIGNUP_BONUS: 3,
    STORY_COST: 1,
    NOVEL_COST: 2,
    FREE_LIMIT_ANONYMOUS: 3,
} as const

export const ROUTES = {
    HOME: '/',
    GENERATE: '/generate',
    MY_STORIES: '/my-stories',
    GALLERY: '/gallery',
    CREDITS: '/credits',
    LOGIN: '/auth/login',
    SIGNUP: '/auth/sign-up',
    LOGOUT: '/auth/logout',
} as const
