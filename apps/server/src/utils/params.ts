export function param(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]
  return value || ''
}

export function query(value: any, defaultValue: string = ''): string {
  if (Array.isArray(value)) return (value[0] as string) || defaultValue
  if (typeof value === 'string') return value
  return defaultValue
}
