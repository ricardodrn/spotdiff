import type { Change, SpotdiffOptions } from './types.js'
import { isObject, isPrimitive, areEqual } from './utils.js'

interface WalkContext {
  changes: Change[]
  options: Required<SpotdiffOptions>
  visited: WeakSet<object>
}

function walk(
  a: unknown,
  b: unknown,
  path: string,
  depth: number,
  ctx: WalkContext
): void {
  if (areEqual(a, b)) return

  // Both primitives or incompatible types — emit change directly
  const aIsObj = isObject(a) || Array.isArray(a)
  const bIsObj = isObject(b) || Array.isArray(b)

  if (!aIsObj && !bIsObj) {
    ctx.changes.push({ path, op: 'changed', from: a, to: b })
    return
  }

  // Type mismatch (one is object/array, other is not)
  if (!aIsObj || !bIsObj) {
    ctx.changes.push({ path, op: 'changed', from: a, to: b })
    return
  }

  if (depth >= ctx.options.maxDepth) {
    if (!areEqual(a, b)) ctx.changes.push({ path, op: 'changed', from: a, to: b })
    return
  }

  // Circular reference detection
  if (typeof a === 'object' && a !== null) {
    if (ctx.visited.has(a as object)) throw new Error(`Circular reference detected at path: ${path || '(root)'}`)
    ctx.visited.add(a as object)
  }
  if (typeof b === 'object' && b !== null) {
    if (ctx.visited.has(b as object)) throw new Error(`Circular reference detected at path: ${path || '(root)'}`)
    ctx.visited.add(b as object)
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    diffArrays(a, b, path, depth, ctx)
  } else if (Array.isArray(a) !== Array.isArray(b)) {
    ctx.changes.push({ path, op: 'changed', from: a, to: b })
  } else {
    diffObjects(
      a as Record<string, unknown>,
      b as Record<string, unknown>,
      path,
      depth,
      ctx
    )
  }
}

function diffArrays(
  a: unknown[],
  b: unknown[],
  path: string,
  depth: number,
  ctx: WalkContext
): void {
  if (ctx.options.arrays === 'smart') {
    diffArraysSmart(a, b, path, depth, ctx)
    return
  }

  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const childPath = `${path}[${i}]`
    if (i >= a.length) {
      ctx.changes.push({ path: childPath, op: 'added', from: undefined, to: b[i] })
    } else if (i >= b.length) {
      ctx.changes.push({ path: childPath, op: 'removed', from: a[i], to: undefined })
    } else {
      walk(a[i], b[i], childPath, depth + 1, ctx)
    }
  }
}

function diffArraysSmart(
  a: unknown[],
  b: unknown[],
  path: string,
  depth: number,
  ctx: WalkContext
): void {
  // For object arrays: try to match by identity keys (id, key, name)
  // Fall back to index-based for primitive arrays
  const allObjects = a.every(isObject) && b.every(isObject)

  if (!allObjects) {
    diffArraysIndex(a, b, path, depth, ctx)
    return
  }

  const IDENTITY_KEYS = ['id', 'key', '_id', 'name']
  const identityKey = IDENTITY_KEYS.find(
    k => a.every(item => isObject(item) && k in (item as Record<string, unknown>))
  )

  if (!identityKey) {
    diffArraysIndex(a, b, path, depth, ctx)
    return
  }

  const aMap = new Map<unknown, { item: Record<string, unknown>; idx: number }>()
  for (let i = 0; i < a.length; i++) {
    const item = a[i] as Record<string, unknown>
    aMap.set(item[identityKey], { item, idx: i })
  }

  const matched = new Set<unknown>()

  for (let j = 0; j < b.length; j++) {
    const bItem = b[j] as Record<string, unknown>
    const id = bItem[identityKey]
    const childPath = `${path}[${j}]`

    if (aMap.has(id)) {
      matched.add(id)
      const { item: aItem } = aMap.get(id)!
      walk(aItem, bItem, childPath, depth + 1, ctx)
    } else {
      ctx.changes.push({ path: childPath, op: 'added', from: undefined, to: bItem })
    }
  }

  for (let i = 0; i < a.length; i++) {
    const aItem = a[i] as Record<string, unknown>
    const id = aItem[identityKey]
    if (!matched.has(id)) {
      ctx.changes.push({ path: `${path}[${i}]`, op: 'removed', from: aItem, to: undefined })
    }
  }
}

function diffArraysIndex(
  a: unknown[],
  b: unknown[],
  path: string,
  depth: number,
  ctx: WalkContext
): void {
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const childPath = `${path}[${i}]`
    if (i >= a.length) {
      ctx.changes.push({ path: childPath, op: 'added', from: undefined, to: b[i] })
    } else if (i >= b.length) {
      ctx.changes.push({ path: childPath, op: 'removed', from: a[i], to: undefined })
    } else {
      walk(a[i], b[i], childPath, depth + 1, ctx)
    }
  }
}

function checkCircular(val: unknown, path: string, visited: WeakSet<object>): void {
  if (typeof val === 'object' && val !== null && !(val instanceof Date) && !(val instanceof Map) && !(val instanceof Set)) {
    if (visited.has(val as object)) {
      throw new Error(`Circular reference detected at path: ${path || '(root)'}`)
    }
  }
}

function diffObjects(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  path: string,
  depth: number,
  ctx: WalkContext
): void {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])

  for (const key of keys) {
    if (ctx.options.ignoreKeys.includes(key)) continue

    const childPath = path ? `${path}.${key}` : key
    const inA = Object.prototype.hasOwnProperty.call(a, key)
    const inB = Object.prototype.hasOwnProperty.call(b, key)

    if (!inA) {
      checkCircular(b[key], childPath, ctx.visited)
      ctx.changes.push({ path: childPath, op: 'added', from: undefined, to: b[key] })
    } else if (!inB) {
      checkCircular(a[key], childPath, ctx.visited)
      ctx.changes.push({ path: childPath, op: 'removed', from: a[key], to: undefined })
    } else {
      walk(a[key], b[key], childPath, depth + 1, ctx)
    }
  }
}

export function spotdiff(a: unknown, b: unknown, options: SpotdiffOptions = {}): Change[] {
  const ctx: WalkContext = {
    changes: [],
    options: {
      maxDepth: options.maxDepth ?? Infinity,
      ignoreKeys: options.ignoreKeys ?? [],
      arrays: options.arrays ?? 'index',
    },
    visited: new WeakSet(),
  }

  walk(a, b, '', 0, ctx)
  return ctx.changes
}
