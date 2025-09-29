/**
 * Error objects that carry a string message.
 */
export interface ErrorWithMessage {
  /** The human-readable error message. */
  message: string;
}

/**
 * Type guard that checks whether a value conforms to ErrorWithMessage.
 *
 * @param value - The unknown value to check.
 * @returns True if the value has a string `message` property; otherwise false.
 */
export function isErrorWithMessage(value: unknown): value is ErrorWithMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}
