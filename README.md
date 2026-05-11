# spotdiff
[![npm](https://img.shields.io/npm/v/spotdiff)](https://www.npmjs.com/package/spotdiff)
[![Socket Badge](https://badge.socket.dev/npm/package/spotdiff/0.1.0)](https://badge.socket.dev/npm/package/spotdiff/0.1.0)

Compare two JS objects, find what changed, patch back, humanize the diff.

## Install

```sh
npm install spotdiff
```

## Usage

```ts
import { spotdiff, patch, humanize } from 'spotdiff'

const v1 = { user: { name: 'Juan', age: 30, tags: ['a', 'b'] } }
const v2 = { user: { name: 'Juan', age: 31, tags: ['a', 'c', 'd'] } }

const changes = spotdiff(v1, v2)
// [
//   { path: 'user.age',     op: 'changed', from: 30,        to: 31  },
//   { path: 'user.tags[1]', op: 'changed', from: 'b',       to: 'c' },
//   { path: 'user.tags[2]', op: 'added',   from: undefined, to: 'd' },
// ]

patch(v1, changes)        // → v2
patch(v2, changes, true)  // → v1

humanize(changes)
// [
//   "user.age changed from 30 to 31",
//   "user.tags[1] changed from b to c",
//   "user.tags[2] was added with value d"
// ]

humanize(changes, { lang: 'es' })
// [
//   "user.age cambió de 30 a 31",
//   "user.tags[1] cambió de b a c",
//   "user.tags[2] fue agregado con valor d"
// ]
```

## API

### `spotdiff(a, b, options?): Change[]`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxDepth` | `number` | `Infinity` | Stop recursion at this depth |
| `ignoreKeys` | `string[]` | `[]` | Skip these keys everywhere |
| `arrays` | `'index' \| 'smart'` | `'index'` | Array comparison strategy |

### `patch(obj, changes, reverse?): unknown`

Apply changes forward or backward (reverse=true).

### `humanize(changes, options?): string[]`

| Option | Type | Default |
|--------|------|---------|
| `lang` | `'en' \| 'es'` | `'en'` |

## Change shape

```ts
interface Change {
  path: string    // "user.address.city" or "tags[2]"
  op: 'added' | 'removed' | 'changed'
  from: unknown   // undefined if op is 'added'
  to: unknown     // undefined if op is 'removed'
}
```

## Notes

- Zero production dependencies
- Dual package ESM + CJS
- TypeScript strict mode
- Never mutates inputs
- Handles `null`, `undefined`, `Date`, `Map`, `Set`
- Throws on circular references with a descriptive message
