export function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
