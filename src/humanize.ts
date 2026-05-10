import type { Change, HumanizeOptions } from './types.js'

type Templates = {
  changed: (path: string, from: unknown, to: unknown) => string
  added: (path: string, to: unknown) => string
  removed: (path: string, from: unknown) => string
}

const templates: Record<string, Templates> = {
  en: {
    changed: (path, from, to) => `${path} changed from ${from} to ${to}`,
    added: (path, to) => `${path} was added with value ${to}`,
    removed: (path, from) => `${path} was removed (was ${from})`,
  },
  es: {
    changed: (path, from, to) => `${path} cambió de ${from} a ${to}`,
    added: (path, to) => `${path} fue agregado con valor ${to}`,
    removed: (path, from) => `${path} fue eliminado (era ${from})`,
  },
}

export function humanize(changes: Change[], options: HumanizeOptions = {}): string[] {
  const lang = options.lang ?? 'en'
  const t = templates[lang] ?? templates['en']

  return changes.map(({ path, op, from, to }) => {
    if (op === 'changed') return t.changed(path, from, to)
    if (op === 'added') return t.added(path, to)
    return t.removed(path, from)
  })
}
