export function canAddFilterPattern(value: string): boolean {
  return value.trim().length > 0;
}

export function shouldShowPluginFilterPatterns(patterns: string[]): boolean {
  return patterns.length > 0;
}
