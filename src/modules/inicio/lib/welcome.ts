const SEEN_PREFIX = 'sigma.welcome.seen.'

export function hasSeenWelcome(userId: number | string) {
  try {
    return localStorage.getItem(`${SEEN_PREFIX}${userId}`) === '1'
  } catch {
    // Sin almacenamiento disponible: se trata como ya vista para no repetirla.
    return true
  }
}

export function markWelcomeSeen(userId: number | string) {
  try {
    localStorage.setItem(`${SEEN_PREFIX}${userId}`, '1')
  } catch {
    /* sin almacenamiento disponible: no se puede recordar */
  }
}

export function greetingFor(date: Date) {
  const hour = date.getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

const ROLE_PHRASES: Record<string, string> = {
  almacenista:
    'Cada elemento bien cuidado es una oportunidad de aprendizaje que llega a tiempo. Gracias por ser el respaldo silencioso de la formación en el SENA.',
  aprendiz:
    'Hoy empieza una nueva oportunidad de aprender. En el SENA, cada paso que das te acerca al futuro que sueñas construir.',
  funcionario:
    'Tu trabajo hace posible que el SENA llegue a cada rincón del país. Gracias por ser parte de una institución que transforma vidas.',
  instructor:
    'Formar es sembrar futuro. Gracias por poner tu conocimiento y tu vocación al servicio de quienes transformarán el país.',
}

const DEFAULT_PHRASE =
  'Bienvenido a SIGMA. Juntos fortalecemos la formación y el desarrollo del país.'

function normalizeRole(role: string) {
  return role
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function phraseForRole(role: string | undefined) {
  if (!role) return DEFAULT_PHRASE
  const normalized = normalizeRole(role)
  const key = Object.keys(ROLE_PHRASES).find((candidate) => normalized.startsWith(candidate))
  return key ? ROLE_PHRASES[key] : DEFAULT_PHRASE
}