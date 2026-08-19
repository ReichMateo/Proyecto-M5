import { logger } from "./logging.js";

interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
}

function isRateLimitError(error: any): boolean {
    return error?.status === 429 || error?.status === 403
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const { maxAttempts = 3, initialDelayMs = 1000 } = options;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (!isRateLimitError(error)) {
                throw error;
            }

            if (attempt === maxAttempts) {
                break;
            }
            const delay = initialDelayMs * Math.pow(2, attempt - 1);
            logger.warn(`Rate limit alcanzado, reintentando en ${delay}ms`, {
                attempt,
                maxAttempts,
            });
            await sleep(delay);
        }
    }

    throw lastError;
}