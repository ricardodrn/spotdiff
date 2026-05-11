import { spotdiff, patch, humanize } from '../src/index.js'

// ── Flat object tests ──────────────────────────────────────────────────────

test('flat: detects added key', () => {
  const changes = spotdiff({ a: 1 }, { a: 1, b: 2 })
  expect(changes).toEqual([{ path: 'b', op: 'added', from: undefined, to: 2 }])
})

test('flat: detects removed key', () => {
  const changes = spotdiff({ a: 1, b: 2 }, { a: 1 })
  expect(changes).toEqual([{ path: 'b', op: 'removed', from: 2, to: undefined }])
})

test('flat: detects changed key', () => {
  const changes = spotdiff({ a: 1 }, { a: 2 })
  expect(changes).toEqual([{ path: 'a', op: 'changed', from: 1, to: 2 }])
})

test('flat: no changes when equal', () => {
  expect(spotdiff({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toEqual([])
})

// ── Deeply nested ──────────────────────────────────────────────────────────

test('deep: 5-level nested change', () => {
  const a = { l1: { l2: { l3: { l4: { l5: 'old' } } } } }
  const b = { l1: { l2: { l3: { l4: { l5: 'new' } } } } }
  const changes = spotdiff(a, b)
  expect(changes).toEqual([
    { path: 'l1.l2.l3.l4.l5', op: 'changed', from: 'old', to: 'new' },
  ])
})

// ── Arrays with primitives ─────────────────────────────────────────────────

test('array: changed by index', () => {
  const changes = spotdiff({ tags: ['a', 'b'] }, { tags: ['a', 'c'] })
  expect(changes).toEqual([
    { path: 'tags[1]', op: 'changed', from: 'b', to: 'c' },
  ])
})

test('array: added element', () => {
  const changes = spotdiff({ tags: ['a'] }, { tags: ['a', 'b'] })
  expect(changes).toEqual([
    { path: 'tags[1]', op: 'added', from: undefined, to: 'b' },
  ])
})

test('array: removed element', () => {
  const changes = spotdiff({ tags: ['a', 'b'] }, { tags: ['a'] })
  expect(changes).toEqual([
    { path: 'tags[1]', op: 'removed', from: 'b', to: undefined },
  ])
})

// ── Arrays with objects ────────────────────────────────────────────────────

test('array of objects: change inside nested object', () => {
  const a = { items: [{ id: 1, val: 'x' }] }
  const b = { items: [{ id: 1, val: 'y' }] }
  const changes = spotdiff(a, b)
  expect(changes).toEqual([
    { path: 'items[0].val', op: 'changed', from: 'x', to: 'y' },
  ])
})

// ── Full example from spec ─────────────────────────────────────────────────

test('spec example', () => {
  const v1 = { user: { name: 'Juan', age: 30, tags: ['a', 'b'] } }
  const v2 = { user: { name: 'Juan', age: 31, tags: ['a', 'c', 'd'] } }
  const changes = spotdiff(v1, v2)
  expect(changes).toEqual([
    { path: 'user.age', op: 'changed', from: 30, to: 31 },
    { path: 'user.tags[1]', op: 'changed', from: 'b', to: 'c' },
    { path: 'user.tags[2]', op: 'added', from: undefined, to: 'd' },
  ])
})

// ── patch ──────────────────────────────────────────────────────────────────

test('patch: applies changes to produce v2', () => {
  const v1 = { user: { name: 'Juan', age: 30, tags: ['a', 'b'] } }
  const v2 = { user: { name: 'Juan', age: 31, tags: ['a', 'c', 'd'] } }
  const changes = spotdiff(v1, v2)
  expect(patch(v1, changes)).toEqual(v2)
})

test('patch: reverse produces v1 from v2', () => {
  const v1 = { user: { name: 'Juan', age: 30, tags: ['a', 'b'] } }
  const v2 = { user: { name: 'Juan', age: 31, tags: ['a', 'c'] } }
  const changes = spotdiff(v1, v2)
  expect(patch(v2, changes, true)).toEqual(v1)
})

test('patch: does not mutate original', () => {
  const v1 = { a: 1 }
  const changes = spotdiff(v1, { a: 2 })
  patch(v1, changes)
  expect(v1).toEqual({ a: 1 })
})

// ── humanize ──────────────────────────────────────────────────────────────

test('humanize: english', () => {
  const changes = spotdiff(
    { user: { name: 'Juan', age: 30, tags: ['a', 'b'] } },
    { user: { name: 'Juan', age: 31, tags: ['a', 'c', 'd'] } }
  )
  expect(humanize(changes)).toEqual([
    'user.age changed from 30 to 31',
    'user.tags[1] changed from b to c',
    'user.tags[2] was added with value d',
  ])
})

test('humanize: spanish', () => {
  const v1 = { user: { name: 'Juan', age: 30, tags: ['a', 'b'] } }
  const v2 = { user: { name: 'Juan', age: 31, tags: ['a', 'c', 'd'] } }
  const changes = spotdiff(v1, v2)
  expect(humanize(changes, { lang: 'es' })).toEqual([
    'user.age cambió de 30 a 31',
    'user.tags[1] cambió de b a c',
    'user.tags[2] fue agregado con valor d',
  ])
})

test('humanize: removed in english', () => {
  const changes = spotdiff({ a: 1 }, {})
  expect(humanize(changes)).toEqual(['a was removed (was 1)'])
})

test('humanize: removed in spanish', () => {
  const changes = spotdiff({ a: 1 }, {})
  expect(humanize(changes, { lang: 'es' })).toEqual(['a fue eliminado (era 1)'])
})

// ── ignoreKeys ────────────────────────────────────────────────────────────

test('ignoreKeys: skips specified keys', () => {
  const changes = spotdiff({ a: 1, b: 2, c: 3 }, { a: 9, b: 2, c: 9 }, { ignoreKeys: ['a', 'c'] })
  expect(changes).toEqual([])
})

test('ignoreKeys: skips deeply nested ignored keys', () => {
  const a = { user: { name: 'Juan', updatedAt: '2020' } }
  const b = { user: { name: 'Juan', updatedAt: '2021' } }
  const changes = spotdiff(a, b, { ignoreKeys: ['updatedAt'] })
  expect(changes).toEqual([])
})

// ── maxDepth ──────────────────────────────────────────────────────────────

test('maxDepth: stops recursion at depth 1', () => {
  const a = { user: { age: 30 } }
  const b = { user: { age: 31 } }
  const changes = spotdiff(a, b, { maxDepth: 1 })
  expect(changes).toEqual([
    { path: 'user', op: 'changed', from: { age: 30 }, to: { age: 31 } },
  ])
})

// ── Date comparison ───────────────────────────────────────────────────────

test('dates: equal dates produce no changes', () => {
  const d = new Date('2024-01-01')
  const changes = spotdiff({ d }, { d: new Date('2024-01-01') })
  expect(changes).toEqual([])
})

test('dates: different dates produce changed', () => {
  const changes = spotdiff(
    { d: new Date('2024-01-01') },
    { d: new Date('2024-01-02') }
  )
  expect(changes[0].op).toBe('changed')
})

// ── null and undefined ────────────────────────────────────────────────────

test('null: no crash on null values', () => {
  expect(() => spotdiff({ a: null }, { a: null })).not.toThrow()
  expect(spotdiff({ a: null }, { a: null })).toEqual([])
})

test('undefined: no crash on undefined values', () => {
  expect(() => spotdiff({ a: undefined }, { a: undefined })).not.toThrow()
})

test('null to value is changed', () => {
  const changes = spotdiff({ a: null }, { a: 1 })
  expect(changes).toEqual([{ path: 'a', op: 'changed', from: null, to: 1 }])
})

// ── Circular reference ────────────────────────────────────────────────────

test('circular: throws descriptive error', () => {
  const a: Record<string, unknown> = { x: 1 }
  a['self'] = a
  expect(() => spotdiff(a, { x: 1 })).toThrow(/[Cc]ircular/)
})

test('circular: shared reference (non-circular) does not throw', () => {
  const shared = { val: 1 }
  const a = { x: shared, y: shared }
  const b = { x: { val: 1 }, y: { val: 2 } }
  expect(() => spotdiff(a, b)).not.toThrow()
  const changes = spotdiff(a, b)
  expect(changes).toEqual([{ path: 'y.val', op: 'changed', from: 1, to: 2 }])
})

// ── Map and Set ───────────────────────────────────────────────────────────

test('Map: treated as opaque (no crash)', () => {
  const m1 = new Map([['k', 1]])
  const m2 = new Map([['k', 1]])
  expect(() => spotdiff({ m: m1 }, { m: m2 })).not.toThrow()
})

test('Map: different Maps reported as changed', () => {
  const changes = spotdiff({ m: new Map([['k', 1]]) }, { m: new Map([['k', 2]]) })
  expect(changes[0]?.op).toBe('changed')
})

test('Set: treated as opaque (no crash)', () => {
  const s1 = new Set([1, 2])
  const s2 = new Set([1, 2])
  expect(() => spotdiff({ s: s1 }, { s: s2 })).not.toThrow()
})

// ── patch: multiple array deletions ──────────────────────────────────────

test('patch: multiple array removals apply without index shift', () => {
  const v1 = { items: ['a', 'b', 'c'] }
  const v2 = { items: ['a'] }
  const changes = spotdiff(v1, v2)
  expect(patch(v1, changes)).toEqual(v2)
})

// ── arrays smart mode ─────────────────────────────────────────────────────

test('arrays smart: matches objects by id', () => {
  const a = { items: [{ id: 1, val: 'x' }, { id: 2, val: 'y' }] }
  const b = { items: [{ id: 2, val: 'y' }, { id: 1, val: 'z' }] }
  const changes = spotdiff(a, b, { arrays: 'smart' })
  // id:1 val changed from x to z
  const valChange = changes.find(c => c.path.includes('val'))
  expect(valChange).toBeDefined()
  expect(valChange?.from).toBe('x')
  expect(valChange?.to).toBe('z')
})
