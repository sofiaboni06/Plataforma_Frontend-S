import {
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import { CloseIcon, SearchIcon } from '@/shared/components/icons/AppIcons'
import { cn } from '@/shared/lib/cn'

import type { ElementoApi } from '@/modules/inventario/types/elemento'

/*
 * Pintar cientos de opciones vuelve lenta la lista y nadie las revisa todas:
 * se muestran las mejores y se invita a escribir más.
 */
const MAX_RESULTS = 30

type Match = {
  elemento: ElementoApi
  disponible: number | null
  score: number
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/*
 * Cada palabra escrita tiene que aparecer en el nombre o el código.
 * Pesa más lo que empieza igual que lo que solo lo contiene.
 */
function scoreOf(elemento: ElementoApi, words: string[]) {
  if (words.length === 0) return 1

  const name = normalize(elemento.nombre)
  const code = normalize(elemento.codigo)
  const nameWords = name.split(/\s+/)
  let score = 0

  for (const word of words) {
    if (name.startsWith(word)) score += 4
    else if (nameWords.some((part) => part.startsWith(word))) score += 3
    else if (code.startsWith(word)) score += 3
    else if (name.includes(word) || code.includes(word)) score += 1
    else return 0
  }

  return score
}

function Highlight({ text, words }: { text: string; words: string[] }) {
  if (words.length === 0) return <>{text}</>

  const normalized = normalize(text)
  const marks = new Array<boolean>(text.length).fill(false)

  for (const word of words) {
    let from = normalized.indexOf(word)
    while (from !== -1) {
      for (let index = from; index < from + word.length; index += 1) {
        marks[index] = true
      }
      from = normalized.indexOf(word, from + word.length)
    }
  }

  const parts: ReactNode[] = []
  let start = 0

  for (let index = 1; index <= text.length; index += 1) {
    if (index === text.length || marks[index] !== marks[start]) {
      const chunk = text.slice(start, index)
      parts.push(
        marks[start] ? (
          <mark key={start} className="rounded-[3px] bg-sena/15 text-inherit">
            {chunk}
          </mark>
        ) : (
          chunk
        ),
      )
      start = index
    }
  }

  return <>{parts}</>
}

/*
 * Sin `availableOf` no se muestra la existencia: el instructor no la ve.
 * Con ella, lo agotado se puede elegir igual y queda pendiente.
 */
export default function ElementoCombobox({
  elementos,
  value,
  onChange,
  availableOf,
  label,
  placeholder,
  inputClassName,
}: {
  elementos: ElementoApi[]
  value: ElementoApi | null
  onChange: (elemento: ElementoApi | null) => void
  availableOf?: (elemento: ElementoApi) => number
  label: string
  placeholder: string
  inputClassName: string
}) {
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const words = useMemo(
    () => normalize(query).split(/\s+/).filter(Boolean),
    [query],
  )

  const matches = useMemo(() => {
    const found: Match[] = []

    for (const elemento of elementos) {
      const score = scoreOf(elemento, words)
      if (score > 0) {
        found.push({ elemento, disponible: availableOf ? availableOf(elemento) : null, score })
      }
    }

    return found.sort(
      (left, right) =>
        Number((right.disponible ?? 1) > 0) - Number((left.disponible ?? 1) > 0) ||
        right.score - left.score ||
        left.elemento.nombre.localeCompare(right.elemento.nombre, 'es'),
    )
  }, [availableOf, elementos, words])

  const visible = matches.slice(0, MAX_RESULTS)

  const moveTo = (index: number) => {
    setActive(index)
    listRef.current
      ?.querySelector(`[data-index="${index}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }

  const pick = (match: Match) => {
    onChange(match.elemento)
    setQuery('')
    setOpen(false)
  }

  const clear = () => {
    onChange(null)
    setQuery('')
    setActive(0)
    setOpen(true)
    inputRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) setOpen(true)
      else if (visible.length) moveTo(Math.min(active + 1, visible.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (visible.length) moveTo(Math.max(active - 1, 0))
    } else if (event.key === 'Enter') {
      if (!open || !visible[active]) return
      event.preventDefault()
      pick(visible[active])
    } else if (event.key === 'Escape' && open) {
      // Cierra la lista sin cerrar el modal que la contiene.
      event.stopPropagation()
      setOpen(false)
    }
  }

  const unidad = (elemento: ElementoApi) =>
    elemento.unidadMedida?.abreviatura ?? ''

  return (
    <div>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-sena-text-soft" />

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && visible[active] ? `${listId}-${active}` : undefined
          }
          autoComplete="off"
          spellCheck={false}
          value={value && !open ? value.nombre : query}
          placeholder={value ? value.nombre : placeholder}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className={cn(inputClassName, 'pl-11', value ? 'pr-11' : '')}
        />

        {value ? (
          <button
            type="button"
            aria-label="Quitar elemento elegido"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clear}
            className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-sena-text-soft transition hover:bg-sena-veil hover:text-sena-dark"
          >
            <CloseIcon className="size-4" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="mt-2 overflow-hidden rounded-2xl border border-sena-line bg-white shadow-[0_12px_32px_-12px_rgba(16,64,40,0.28)]">
          {visible.length === 0 ? (
            <p className="px-4 py-5 text-sm text-sena-text-soft">
              Ningún elemento coincide con “{query.trim()}”. Prueba con otra
              palabra o con el código.
            </p>
          ) : (
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={label}
              className="max-h-72 overflow-y-auto overscroll-contain py-1.5"
            >
              {visible.map((match, index) => {
                const { elemento, disponible } = match
                const agotado = disponible !== null && disponible <= 0
                const selected = value?.id === elemento.id

                return (
                  <li
                    key={elemento.id}
                    id={`${listId}-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={selected}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseMove={() => index !== active && setActive(index)}
                    onClick={() => pick(match)}
                    className={cn(
                      'mx-1.5 flex cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2.5',
                      index === active ? 'bg-sena-soft' : '',
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-sena-text">
                        <Highlight text={elemento.nombre} words={words} />
                      </p>
                      <p className="mt-0.5 truncate text-xs text-sena-text-soft">
                        <Highlight text={elemento.codigo} words={words} />
                      </p>
                    </div>

                    {disponible !== null ? (
                      <span
                        className={cn(
                          'shrink-0 text-xs font-semibold tabular-nums',
                          agotado ? 'text-sena-danger-text' : 'text-sena-strong',
                        )}
                      >
                        {agotado
                          ? 'Sin existencia'
                          : `${disponible}${unidad(elemento) ? ` ${unidad(elemento)}` : ''} disp.`}
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}

          {matches.length > visible.length ? (
            <p className="border-t border-sena-hairline px-4 py-2.5 text-xs text-sena-text-soft">
              Mostrando {visible.length} de {matches.length}. Escribe más para
              encontrarlo más rápido.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
