export interface ErrorWithMessage {
  message: string;
}

export function isErrorWithMessage(value: unknown): value is ErrorWithMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  );
}
