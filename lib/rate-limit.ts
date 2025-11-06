/**
 * Rate limiting utility using in-memory cache
 * Limits API requests per user/IP to prevent abuse
 */

interface RateLimitStore {
    count: number
    resetTime: number
}

const store = new Map<string, RateLimitStore>()

interface RateLimitOptions {
    interval?: number // Time window in milliseconds
    uniqueTokenPerInterval?: number // Max unique tokens to track
}

export function rateLimit(options?: RateLimitOptions) {
    const interval = options?.interval || 60000 // Default: 1 minute
    const maxTokens = options?.uniqueTokenPerInterval || 500

    return {
        check: async (limit: number, token: string): Promise<boolean> => {
            const now = Date.now()
            const tokenData = store.get(token)

            // Clean up expired entries if store is getting too large
            if (store.size > maxTokens) {
                const keysToDelete: string[] = []
                store.forEach((value, key) => {
                    if (now > value.resetTime) {
                        keysToDelete.push(key)
                    }
                })
                keysToDelete.forEach(key => store.delete(key))
            }

            if (!tokenData || now > tokenData.resetTime) {
                // First request or window expired
                store.set(token, {
                    count: 1,
                    resetTime: now + interval,
                })
                return true
            }

            // Increment count
            tokenData.count += 1

            if (tokenData.count > limit) {
                return false // Rate limit exceeded
            }

            return true
        },

        reset: (token: string) => {
            store.delete(token)
        },

        getRemaining: (token: string): number => {
            const tokenData = store.get(token)
            if (!tokenData || Date.now() > tokenData.resetTime) {
                return 0
            }
            return tokenData.count
        }
    }
}

// Create limiters with different configurations
export const apiLimiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
})

export const generationLimiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
})

export const authLimiter = rateLimit({
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 500,
})
