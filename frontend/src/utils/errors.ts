export function getErrorMessage(error: unknown, fallbackMessage = 'Something went wrong.'): string {
  return error instanceof Error ? error.message : fallbackMessage;
}
