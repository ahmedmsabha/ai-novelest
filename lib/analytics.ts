/**
 * Analytics tracking utility
 * Tracks user events and interactions
 */

export interface AnalyticsEvent {
    name: string
    properties?: Record<string, any>
    userId?: string
    timestamp?: number
}

export function trackEvent({ name, properties, userId }: AnalyticsEvent) {
    if (typeof window === 'undefined') return

    const event: AnalyticsEvent = {
        name,
        properties: {
            ...properties,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
        },
        userId,
        timestamp: Date.now(),
    }

    // Vercel Analytics
    if (typeof window !== 'undefined' && (window as any).va) {
        ; (window as any).va('track', name, properties)
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics]', name, properties)
    }

    // You can add other analytics providers here
    // Example: Google Analytics, Mixpanel, Segment, etc.
}

// Predefined tracking functions for common events
export const analytics = {
    // Story generation events
    storyGenerated: (properties: {
        genre: string
        tone: string
        length: string
        storyType: string
        wordCount?: number
    }) => trackEvent({ name: 'story_generated', properties }),

    // Novel generation events
    outlineGenerated: (properties: {
        genre: string
        tone: string
        numberOfArcs: number
        chaptersPerArc: number
        hasTitle: boolean
    }) => trackEvent({ name: 'outline_generated', properties }),

    chapterGenerated: (properties: {
        chapterNumber: number
        wordCount: number
        genre: string
    }) => trackEvent({ name: 'chapter_generated', properties }),

    titleGenerated: (properties: {
        genre: string
        tone: string
    }) => trackEvent({ name: 'title_generated', properties }),

    // User actions
    storyViewed: (properties: {
        storyId: string
        storyType: string
        genre: string
    }) => trackEvent({ name: 'story_viewed', properties }),

    storySaved: (properties: {
        storyId: string
        storyType: string
        wordCount: number
    }) => trackEvent({ name: 'story_saved', properties }),

    storyPublished: (properties: {
        storyId: string
        storyType: string
    }) => trackEvent({ name: 'story_published', properties }),

    storyDownloaded: (properties: {
        storyId: string
        format: 'txt' | 'pdf'
    }) => trackEvent({ name: 'story_downloaded', properties }),

    // Credits events
    creditsPurchased: (properties: {
        amount: number
        package: string
    }) => trackEvent({ name: 'credits_purchased', properties }),

    // Auth events
    userSignedUp: () => trackEvent({ name: 'user_signed_up' }),
    userLoggedIn: () => trackEvent({ name: 'user_logged_in' }),
    userLoggedOut: () => trackEvent({ name: 'user_logged_out' }),

    // Error events
    errorOccurred: (properties: {
        errorType: string
        errorMessage: string
        page?: string
    }) => trackEvent({ name: 'error_occurred', properties }),
}
