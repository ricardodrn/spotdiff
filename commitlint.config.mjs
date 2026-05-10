/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      // Allow hyphens in type (e.g. hot-fix)
      headerPattern: /^([\w-]*)(?:\(([\w$.\-* ]*)\))?!?: (.*)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
  rules: {
    'subject-case': [0],
    'type-enum': [
      2,
      'always',
      [
        'ci',
        'test',
        'build',
        'chore',
        'docs',
        'ticket',
        'release',
        'feat',
        'fix',
        'hot-fix',
        'perf',
        'refactor',
        'revert',
        'style',
      ],
    ],
  },
}
