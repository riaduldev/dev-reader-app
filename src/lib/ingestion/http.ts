import { env } from "@/lib/env";

export class HttpError extends Error {
  status: number;
  url: string;
  retryable: boolean;

  constructor(message: string, status: number, url: string, retryable = false) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.url = url;
    this.retryable = retryable;
  }
}

export interface FetchOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  method?: string;
  body?: string;
  accept?: string;
}

const DEFAULT_USER_AGENT =
  "DevReaderHub/0.1 (+https://github.com/devreaderhub; developer news aggregator)";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function retryAfterMs(response: Response): number | null {
  const header = response.headers.get("retry-after");
  if (!header) return null;
  const seconds = Number(header);
  if (!Number.isNaN(seconds)) return Math.min(seconds * 1000, 60000);
  const date = Date.parse(header);
  if (!Number.isNaN(date)) return Math.min(Math.max(0, date - Date.now()), 60000);
  return null;
}

/**
 * Fetch with a timeout and exponential backoff for transient failures
 * (network errors, timeouts, 408/425/429 and 5xx responses).
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? env().INGEST_TIMEOUT_MS;
  const maxRetries = options.retries ?? env().INGEST_MAX_RETRIES;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
          ...(options.accept ? { Accept: options.accept } : {}),
          ...options.headers,
        },
        body: options.body,
        signal: controller.signal,
        redirect: "follow",
        cache: "no-store",
      });

      if (response.ok) {
        return response;
      }

      const retryable = isRetryableStatus(response.status);
      if (!retryable || attempt === maxRetries) {
        throw new HttpError(
          `Request to ${url} failed with status ${response.status}`,
          response.status,
          url,
          retryable,
        );
      }

      const wait = retryAfterMs(response) ?? backoffDelay(attempt);
      lastError = new HttpError(
        `Request to ${url} failed with status ${response.status}`,
        response.status,
        url,
        true,
      );
      await sleep(wait);
    } catch (error) {
      if (error instanceof HttpError) throw error;

      const aborted = error instanceof Error && error.name === "AbortError";
      lastError = new HttpError(
        aborted
          ? `Request to ${url} timed out after ${timeoutMs}ms`
          : `Request to ${url} failed: ${error instanceof Error ? error.message : String(error)}`,
        aborted ? 408 : 0,
        url,
        true,
      );

      if (attempt === maxRetries) break;
      await sleep(backoffDelay(attempt));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new HttpError(`Request to ${url} failed`, 0, url);
}

/** Exponential backoff with jitter: 1s, 2s, 4s … (capped at 30s). */
export function backoffDelay(attempt: number): number {
  const base = Math.min(30000, 1000 * 2 ** attempt);
  const jitter = Math.floor(Math.random() * Math.min(1000, base * 0.25));
  return base + jitter;
}
