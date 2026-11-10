/**
 * Deja en el chat una sola respuesta corta, la que corresponde a la
 * pregunta. El servidor a veces devuelve varias guías pegadas; aquí se
 * elige la más cercana y se muestra solo su primer tramo útil.
 */

const DISCLAIMER =
  /^si no te aparece el menu, el boton o la pantalla, puede ser por los permisos/i

/** Título de guía tal como lo arma el backend: "Tema (Módulo)". */
const GUIDE_TITLE = /^.{6,90}\([^)]{2,40}\)\s*$/

const STOP_WORDS = new Set([
  'como',
  'que',
  'cual',
  'cuales',
  'donde',
  'cuando',
  'para',
  'por',
  'con',
  'del',
  'los',
  'las',
  'una',
  'uno',
  'este',
  'esta',
  'eso',
  'son',
  'hay',
  'puedo',
  'puede',
  'sigma',
])

type Section = {
  title: string
  body: string
}

function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function keywords(value: string): string[] {
  return fold(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
}

function stripDisclaimer(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph && !DISCLAIMER.test(fold(paragraph)))
    .join('\n\n')
    .trim()
}

function splitGuides(reply: string): Section[] {
  const sections: Array<{ title: string; lines: string[] }> = []
  let current: { title: string; lines: string[] } | null = null

  for (const line of reply.replace(/\r\n/g, '\n').split('\n')) {
    const trimmed = line.trim()
    if (GUIDE_TITLE.test(trimmed)) {
      if (current) sections.push(current)
      current = {
        title: trimmed.replace(/\s*\([^)]*\)\s*$/, '').trim(),
        lines: [],
      }
      continue
    }
    if (!current) current = { title: '', lines: [] }
    current.lines.push(line)
  }
  if (current) sections.push(current)

  return sections
    .map((section) => ({
      title: section.title,
      body: stripDisclaimer(section.lines.join('\n')),
    }))
    .filter((section) => section.body)
}

function score(question: string, section: Section): number {
  const wanted = keywords(question)
  if (!wanted.length) return 0
  const titleWords = new Set(keywords(section.title))
  const bodyWords = new Set(keywords(section.body.slice(0, 320)))
  return wanted.reduce((total, word) => {
    if (titleWords.has(word)) return total + 3
    if (bodyWords.has(word)) return total + 1
    return total
  }, 0)
}

/** La respuesta elegida se muestra completa: el servidor ya la dejó en un solo tema. */
function present(text: string): string {
  const clean = text.trim()
  if (clean.length <= 8000) return clean
  return `${clean.slice(0, 8000).trim()}…`
}

export function focusAssistantReply(
  question: string,
  reply: string,
  referenceTitles: string[] = [],
): { text: string; titles: string[] } {
  const sections = splitGuides(reply)
  if (!sections.length) {
    return { text: present(stripDisclaimer(reply)), titles: referenceTitles.slice(0, 1) }
  }

  let chosen = sections[0]
  let best = score(question, chosen)
  for (const section of sections.slice(1)) {
    const next = score(question, section)
    if (next > best) {
      chosen = section
      best = next
    }
  }

  const chosenTitle = fold(chosen.title)
  const titles = referenceTitles.filter((title) => {
    const folded = fold(title)
    return folded.length > 0 && chosenTitle.length > 0 && (chosenTitle.includes(folded) || folded.includes(chosenTitle))
  })

  return {
    text: present(chosen.body),
    titles: titles.length > 0 ? titles.slice(0, 1) : referenceTitles.slice(0, 1),
  }
}
