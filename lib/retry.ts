/**
 * Retry utility for handling failed API requests
 * Implements exponential backoff strategy
 */

export interface RetryOptions {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffMultiplier?: number
    onRetry?: (attempt: number, error: Error) => void
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        backoffMultiplier = 2,
        onRetry,
    } = options

    let lastError: Error | null = null
    let delay = initialDelay

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error as Error

            // Don't retry on the last attempt
            if (attempt === maxRetries) {
                break
            }

            // Call onRetry callback if provided
            if (onRetry) {
                onRetry(attempt + 1, lastError)
            }

            // Wait before retrying with exponential backoff
            await sleep(Math.min(delay, maxDelay))
            delay *= backoffMultiplier
        }
    }

    throw lastError || new Error('Failed after retries')
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry specific to fetch requests
 */
export async function fetchWithRetry(
    url: string,
    options?: RequestInit,
    retryOptions?: RetryOptions
): Promise<Response> {
    return withRetry(
        async () => {
            const response = await fetch(url, options)

            // Only retry on network errors or 5xx server errors
            if (!response.ok && response.status >= 500) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            return response
        },
        retryOptions
    )
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
    const retryableMessages = [
        'network',
        'timeout',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'fetch failed',
    ]

    return retryableMessages.some(msg =>
        error.message.toLowerCase().includes(msg.toLowerCase())
    )
}
