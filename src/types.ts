export type Op = 'added' | 'removed' | 'changed'

export interface Change {
  path: string
  op: Op
  from: unknown
  to: unknown
}

export interface SpotdiffOptions {
  maxDepth?: number
  ignoreKeys?: string[]
  arrays?: 'index' | 'smart'
}

export interface HumanizeOptions {
  lang?: 'en' | 'es'
}

export interface PatchOptions {
  reverse?: boolean
}
