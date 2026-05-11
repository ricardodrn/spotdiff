import type { Op } from './types.js'

export function isObject(val: unknown): val is Record<string, unknown> {
  return (
    val !== null &&
    typeof val === 'object' &&
    !(val instanceof Date) &&
    !(val instanceof Map) &&
    !(val instanceof Set) &&
    !Array.isArray(val)
  )
}

export function isPrimitive(val: unknown): boolean {
  if (val === null || val === undefined) return true
  if (val instanceof Date) return true
  const t = typeof val
  return t === 'string' || t === 'number' || t === 'boolean' || t === 'bigint' || t === 'symbol'
}

export function invertOp(op: Op): Op {
  if (op === 'added') return 'removed'
  if (op === 'removed') return 'added'
  return 'changed'
}

export function normalizePath(path: string): string {
  return path
}

export function areEqual(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  return Object.is(a, b)
}
