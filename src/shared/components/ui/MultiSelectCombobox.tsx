import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { CloseIcon, SearchIcon } from '@/shared/components/icons/AppIcons'
import { cn } from '@/shared/lib/cn'

const MAX_RESULTS = 20

export type ComboOption = {
  id: number
  title: string
  subtitle?: string | null
  keywords?: string
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function haystack(option: ComboOption) {
  return normalize(`${option.title} ${option.subtitle ?? ''} ${option.keywords ?? ''}`)
}

/*
 * Cada palabra escrita tiene que aparecer en el texto; pesa más lo que empieza
 * igual. Con esto se puede escribir el código o parte del nombre.
 */
function scoreOf(option: ComboOption, words: string[]) {
  if (words.length === 0) return 1

  const title = normalize(option.title)
  const titleWords = title.split(/\s+/)
  const hay = haystack(option)
  let score = 0

  for (const word of words) {
    if (title.startsWith(word)) score += 4
    else if (titleWords.some((part) => part.startsWith(word))) score += 3
    else if (hay.includes(word)) score += 1
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

/**
 * Selector de varias opciones con búsqueda. Pensado para listas largas: se
 * escribe y se eligen las coincidencias; las elegidas quedan como fichas.
 */
export default function MultiSelectCombobox({
  options,
  selectedIds,
  onToggle,
  label,
  placeholder,
  emptyMessage = 'No hay opciones disponibles.',
  loading = false,
  loadingLabel = 'Cargando…',
  disabled = false,
}: {
  options: ComboOption[]
  selectedIds: number[]
  onToggle: (id: number) => void
  label?: string
  placeholder: string
  emptyMessage?: string
  loading?: boolean
  loadingLabel?: string
  disabled?: boolean
}) {
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const words = useMemo(() => normalize(query).split(/\s+/).filter(Boolean), [query])

  const matches = useMemo(() => {
    return options
      .map((option) => ({ option, score: scoreOf(option, words) }))
      .filter((match) => match.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score || left.option.title.localeCompare(right.option.title, 'es'),
      )
      .map((match) => match.option)
  }, [options, words])

  const visible = matches.slice(0, MAX_RESULTS)
  const selectedOptions = options.filter((option) => selectedIds.includes(option.id))

  const moveTo = (index: number) => {
    setActive(index)
    listRef.current
      ?.querySelector(`[data-index="${index}"]`)
      ?.scrollIntoView({ block: 'nearest' })
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
      onToggle(visible[active].id)
    } else if (event.key === 'Escape' && open) {
      // Cierra la lista sin cerrar el modal que la contiene.
      event.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={`${listId}-input`} className="text-sm font-medium text-sena-text/75">
            {label}
          </label>
          <span className="text-xs font-semibold text-sena-text-soft">
            {selectedIds.length} {selectedIds.length === 1 ? 'seleccionado' : 'seleccionados'}
          </span>
        </div>
      ) : null}

      {loading ? (
        <p className="rounded-xl border border-sena-line bg-sena-veil/50 px-4 py-3 text-sm text-sena-text-soft">
          {loadingLabel}
        </p>
      ) : options.length === 0 ? (
        <p className="rounded-xl border border-sena-line bg-sena-veil/50 px-4 py-3 text-sm text-sena-text-soft">
          {emptyMessage}
        </p>
      ) : (
        <>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-sena-text-soft" />

            <input
              ref={inputRef}
              id={`${listId}-input`}
              type="text"
              role="combobox"
              aria-label={label ?? placeholder}
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                open && visible[active] ? `${listId}-${visible[active].id}` : undefined
              }
              autoComplete="off"
              spellCheck={false}
              disabled={disabled}
              value={query}
              placeholder={placeholder}
              onChange={(event) => {
                setQuery(event.target.value)
                setActive(0)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onClick={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={onKeyDown}
              className="form-field pl-11 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {open ? (
            <div
              onMouseDown={(event) => event.preventDefault()}
              className="overflow-hidden rounded-2xl border border-sena-line bg-white shadow-[0_12px_32px_-12px_rgba(16,64,40,0.28)]"
            >
              {visible.length === 0 ? (
                <p className="px-4 py-5 text-sm text-sena-text-soft">
                  Ningún programa coincide con “{query.trim()}”. Prueba con otra palabra o con el
                  código.
                </p>
              ) : (
                <ul
                  ref={listRef}
                  id={listId}
                  role="listbox"
                  aria-label={label ?? placeholder}
                  className="max-h-64 overflow-y-auto overscroll-contain py-1.5"
                >
                  {visible.map((option, index) => {
                    const selected = selectedIds.includes(option.id)

                    return (
                      <li
                        key={option.id}
                        id={`${listId}-${option.id}`}
                        data-index={index}
                        role="option"
                        aria-selected={selected}
                        onMouseMove={() => index !== active && setActive(index)}
                        onClick={() => onToggle(option.id)}
                        className={cn(
                          'mx-1.5 flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5',
                          index === active ? 'bg-sena-soft' : '',
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-sena-text">
                            <Highlight text={option.title} words={words} />
                          </p>
                          {option.subtitle ? (
                            <p className="mt-0.5 truncate text-xs text-sena-text-soft">
                              <Highlight text={option.subtitle} words={words} />
                            </p>
                          ) : null}
                        </div>

                        <span
                          aria-hidden="true"
                          className={cn(
                            'grid size-5 shrink-0 place-items-center rounded-md border text-xs font-bold',
                            selected
                              ? 'border-sena bg-sena text-white'
                              : 'border-sena-line text-transparent',
                          )}
                        >
                          ✓
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}

              {matches.length > visible.length ? (
                <p className="border-t border-sena-hairline px-4 py-2.5 text-xs text-sena-text-soft">
                  Mostrando {visible.length} de {matches.length}. Escribe más para encontrar más
                  rápido.
                </p>
              ) : null}
            </div>
          ) : null}

          {selectedOptions.length ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedOptions.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-sena-soft py-1 pr-1.5 pl-3 text-xs font-semibold text-sena-dark"
                >
                  <span className="truncate">{option.title}</span>
                  <button
                    type="button"
                    aria-label={`Quitar ${option.title}`}
                    onClick={() => onToggle(option.id)}
                    className="grid size-5 shrink-0 place-items-center rounded-full text-sena-dark/70 transition hover:bg-white/80 hover:text-sena-dark"
                  >
                    <CloseIcon className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
