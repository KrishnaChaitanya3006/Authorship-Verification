export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isQuotaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const errorMessage = error.message.toLowerCase();
  return (
    errorMessage.includes('exceeded your current quota') ||
    errorMessage.includes('429') ||
    errorMessage.includes('rate limit')
  );
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (isQuotaError(error)) {
      return 'The AI service is currently experiencing high demand. Please wait a moment and try again, or contact support if the issue persists.';
    }
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}