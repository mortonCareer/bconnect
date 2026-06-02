// One-off codemod (#457): substitute px-arbitrary Tailwind classes with exact token equivalents.
// Tailwind v4 dynamic spacing: `util-N` == N*0.25rem, so `util-[Mpx]` == `util-(M/4)` when M%4==0
// (integer token, always valid in v4) or M in {2,6,10,14} (standard half-steps 0.5/1.5/2.5/3.5).
// Conservative: skip text-* (line-height differs), leading-*, colors, non-px, calc/%, anything else.
// Run: node scripts/codemod-arbitrary-to-token.mjs [--apply]
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const APPLY = process.argv.includes('--apply')

// spacing/size utilities that consume the v4 spacing scale
const SPACING = [
  'p',
  'px',
  'py',
  'pt',
  'pb',
  'pl',
  'pr',
  'ps',
  'pe',
  'm',
  'mx',
  'my',
  'mt',
  'mb',
  'ml',
  'mr',
  'ms',
  'me',
  'gap',
  'gap-x',
  'gap-y',
  'w',
  'h',
  'size',
  'min-w',
  'max-w',
  'min-h',
  'max-h',
  'top',
  'left',
  'right',
  'bottom',
  'inset',
  'inset-x',
  'inset-y',
  'start',
  'end',
  'space-x',
  'space-y',
]
const HALF = { 2: '0.5', 6: '1.5', 10: '2.5', 14: '3.5' }
const ROUNDED = { 2: 'sm', 4: '', 6: 'md', 8: 'lg', 12: 'xl', 16: '2xl', 24: '3xl' }
// byte-exact color tokens only: #386dff = --color-primary-500 (semantic `primary`), #000000 = `black`.
// Figma-custom hexes (grays, Material tints) have no exact existing token -> left for design decision.
const COLOR_UTILS = [
  'text',
  'bg',
  'border',
  'ring',
  'fill',
  'stroke',
  'outline',
  'divide',
  'decoration',
  'caret',
  'accent',
  'from',
  'via',
  'to',
]
const COLOR_MAP = { '#386dff': 'primary', '#000000': 'black' }
const colorAlt = COLOR_UTILS.join('|')
const colorRe = new RegExp(`((?:[a-z][a-z0-9-]*:)*)(${colorAlt})-\\[(#[0-9a-fA-F]{3,8})\\]`, 'g')

function spacingToken(px) {
  if (px % 4 === 0) return String(px / 4) // integer token, valid in v4 dynamic spacing
  if (HALF[px]) return HALF[px]
  return null // not exactly representable -> genuine arbitrary
}

// build alternation, longest-first so `gap-x` wins over `gap`
const utilAlt = [...SPACING].sort((a, b) => b.length - a.length).join('|')
// (variant:)* prefix, util, [Npx]
const spacingRe = new RegExp(`((?:-)?(?:[a-z][a-z0-9-]*:)*)(${utilAlt})-\\[(\\d+)px\\]`, 'g')
const roundedRe = /((?:[a-z][a-z0-9-]*:)*)(rounded(?:-[a-z]{1,2})?)-\[(\d+)px\]/g

const files = execSync(
  `grep -rlE "[a-z0-9]-\\[(#[0-9a-fA-F]|[0-9]+px)" --include="*.tsx" --include="*.ts" apps packages | grep -v node_modules | grep -v .next`,
  { encoding: 'utf8' }
)
  .trim()
  .split('\n')
  .filter(Boolean)

const subs = new Map() // old -> new (counts)
const residue = new Map() // skipped arbitrary -> count
let changedFiles = 0

for (const file of files) {
  let src = readFileSync(file, 'utf8')
  let out = src

  out = out.replace(spacingRe, (m, variant, util, pxStr) => {
    const tok = spacingToken(Number(pxStr))
    if (tok === null) {
      residue.set(m, (residue.get(m) || 0) + 1)
      return m
    }
    const next = `${variant}${util}-${tok}`
    subs.set(`${m} → ${next}`, (subs.get(`${m} → ${next}`) || 0) + 1)
    return next
  })

  out = out.replace(roundedRe, (m, variant, util, pxStr) => {
    const name = ROUNDED[Number(pxStr)]
    if (name === undefined) {
      residue.set(m, (residue.get(m) || 0) + 1)
      return m
    }
    const next = name === '' ? `${variant}${util}` : `${variant}${util}-${name}`
    subs.set(`${m} → ${next}`, (subs.get(`${m} → ${next}`) || 0) + 1)
    return next
  })

  out = out.replace(colorRe, (m, variant, util, hex) => {
    const tok = COLOR_MAP[hex.toLowerCase()]
    if (!tok) {
      residue.set(m, (residue.get(m) || 0) + 1)
      return m
    }
    const next = `${variant}${util}-${tok}`
    subs.set(`${m} → ${next}`, (subs.get(`${m} → ${next}`) || 0) + 1)
    return next
  })

  if (out !== src) {
    changedFiles++
    if (APPLY) writeFileSync(file, out)
  }
}

const subCount = [...subs.values()].reduce((a, b) => a + b, 0)
const resCount = [...residue.values()].reduce((a, b) => a + b, 0)
console.log(`\n=== ${APPLY ? 'APPLIED' : 'DRY-RUN'} — files touched: ${changedFiles} ===`)
console.log(`substitutions: ${subCount} | residue (kept arbitrary): ${resCount}\n`)
console.log('--- substitutions (unique mapping × count) ---')
for (const [k, v] of [...subs.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${v}×  ${k}`)
console.log('\n--- residue: px-arbitrary with NO exact token (genuine) ---')
for (const [k, v] of [...residue.entries()].sort((a, b) => b[1] - a[1]))
  console.log(`  ${v}×  ${k}`)
