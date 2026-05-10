import type { Change, PatchOptions } from './types.js'

function cloneDeep(val: unknown): unknown {
  if (val === null || val === undefined) return val
  if (val instanceof Date) return new Date(val.getTime())
  if (val instanceof Map) return new Map(val)
  if (val instanceof Set) return new Set(val)
  if (Array.isArray(val)) return val.map(cloneDeep)
  if (typeof val === 'object') {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(val as object)) {
      out[key] = cloneDeep((val as Record<string, unknown>)[key])
    }
    return out
  }
  return val
}

type PathSegment = { type: 'key'; key: string } | { type: 'index'; index: number }

function parsePath(path: string): PathSegment[] {
  const segments: PathSegment[] = []
  // Split on dots and brackets
  // e.g. "user.tags[2].name" → ['user', 'tags', '[2]', 'name']
  const regex = /([^.[]+)|\[(\d+)\]/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(path)) !== null) {
    if (match[1] !== undefined) {
      segments.push({ type: 'key', key: match[1] })
    } else if (match[2] !== undefined) {
      segments.push({ type: 'index', index: parseInt(match[2], 10) })
    }
  }
  return segments
}

export function getPath(obj: unknown, path: string): unknown {
  const segments = parsePath(path)
  let cur: unknown = obj
  for (const seg of segments) {
    if (cur === null || cur === undefined) return undefined
    if (seg.type === 'key') {
      cur = (cur as Record<string, unknown>)[seg.key]
    } else {
      cur = (cur as unknown[])[seg.index]
    }
  }
  return cur
}

export function setPath(obj: unknown, path: string, value: unknown): void {
  const segments = parsePath(path)
  let cur: unknown = obj
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]
    if (seg.type === 'key') {
      const o = cur as Record<string, unknown>
      if (o[seg.key] === null || o[seg.key] === undefined) {
        const next = segments[i + 1]
        o[seg.key] = next.type === 'index' ? [] : {}
      }
      cur = o[seg.key]
    } else {
      const arr = cur as unknown[]
      if (arr[seg.index] === null || arr[seg.index] === undefined) {
        const next = segments[i + 1]
        arr[seg.index] = next.type === 'index' ? [] : {}
      }
      cur = arr[seg.index]
    }
  }

  const last = segments[segments.length - 1]
  if (last.type === 'key') {
    (cur as Record<string, unknown>)[last.key] = value
  } else {
    (cur as unknown[])[last.index] = value
  }
}

export function deletePath(obj: unknown, path: string): void {
  const segments = parsePath(path)
  let cur: unknown = obj
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]
    if (cur === null || cur === undefined) return
    if (seg.type === 'key') {
      cur = (cur as Record<string, unknown>)[seg.key]
    } else {
      cur = (cur as unknown[])[seg.index]
    }
  }

  if (cur === null || cur === undefined) return
  const last = segments[segments.length - 1]
  if (last.type === 'key') {
    delete (cur as Record<string, unknown>)[last.key]
  } else {
    (cur as unknown[]).splice(last.index, 1)
  }
}

export function patch(obj: unknown, changes: Change[], reverse = false): unknown {
  const cloned = cloneDeep(obj)

  for (const change of changes) {
    const { path, op, from, to } = change

    if (reverse) {
      // Invert: added→remove, removed→add, changed→swap from/to
      if (op === 'added') {
        deletePath(cloned, path)
      } else if (op === 'removed') {
        setPath(cloned, path, from)
      } else {
        setPath(cloned, path, from)
      }
    } else {
      if (op === 'added') {
        setPath(cloned, path, to)
      } else if (op === 'removed') {
        deletePath(cloned, path)
      } else {
        setPath(cloned, path, to)
      }
    }
  }

  return cloned
}
