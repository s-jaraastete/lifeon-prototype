'use client'

import { ReactNode, useState } from 'react'
import Autocomplete from '@/components/reusable/Autocomplete'
import Spinner from '@/components/reusable/Spinner'
import { PlusIcon, PencilSquareIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/solid'
import axiosManager from '@/lib/axios_manager'

type InterfaceWithId = { id: number }

type EditableAutocompleteSingleProps<T extends InterfaceWithId> = {
  multiple?: false | never
  selected: T | null
  setSelected: (value: T | null) => void
  onItemSelected?: (value: T | null) => void
}

type EditableAutocompleteMultipleProps<T extends InterfaceWithId> = {
  multiple: true
  selected: T[]
  setSelected: (value: T[]) => void
  onItemSelected?: (value: T[]) => void
}

type EditableAutocompleteProps<T extends InterfaceWithId> = (
  EditableAutocompleteSingleProps<T> | EditableAutocompleteMultipleProps<T>
) & {
  // ── Autocomplete passthrough ──────────────────────────────────────────────
  endpoint: string
  queryKey: string[]
  label?: keyof T
  item: (value: T) => ReactNode
  placeholder?: string
  domain?: string
  onClose?: () => void
  enableAutocomplete?: boolean
  optionsHeight?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  viewOnly?: boolean
  // ── CRUD ──────────────────────────────────────────────────────────────────
  /** POST endpoint to create a new record. */
  createEndpoint: string
  /**
   * PATCH endpoint to edit the selected record.
   * Accepts a string with `{id}` placeholder (e.g. `/asset_types/{id}/`)
   * or a function that receives the record id. If omitted the edit button is hidden.
   */
  editEndpoint?: string | ((id: number) => string)
  /**
   * Build the request body from the typed name.
   * Defaults to `{ name }`.
   */
  getPayload?: (name: string) => Record<string, unknown>
  /**
   * Extract the display string from a selected item to pre-fill the edit input.
   * Defaults to reading `item[label ?? 'name']`.
   */
  getDisplayValue?: (item: T) => string
  /** Placeholder for the create text input. */
  createPlaceholder?: string
  /** Placeholder for the edit text input. */
  editPlaceholder?: string
}

const resolveEditEndpoint = (
  editEndpoint: string | ((id: number) => string),
  id: number
): string =>
  typeof editEndpoint === 'function'
    ? editEndpoint(id)
    : editEndpoint.replace('{id}', String(id))

const EditableAutocomplete = <T extends InterfaceWithId>(
  props: EditableAutocompleteProps<T>
) => {
  const {
    multiple,
    createEndpoint,
    editEndpoint,
    getPayload = (name) => ({ name }),
    getDisplayValue,
    createPlaceholder = 'Nombre del nuevo registro',
    editPlaceholder = 'Editar nombre del registro',
    selected,
    setSelected,
    onItemSelected,
    // remaining props forwarded to Autocomplete
    ...autocompleteProps
  } = props

  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const editTarget = multiple
    ? (selected as T[]).length === 1 ? (selected as T[])[0] : null
    : (selected as T | null)

  const resolveDisplayValue = (item: T): string => {
    if (getDisplayValue) return getDisplayValue(item)
    const key = (props.label ?? 'name') as keyof T
    return String(item[key] ?? '')
  }

  const handleConfirmCreate = async () => {
    if (!inputValue.trim()) return
    setIsSaving(true)
    try {
      const data = await axiosManager(
        createEndpoint,
        getPayload(inputValue.trim()),
        { method: 'post', useAccessToken: true }
      )
      const created = data as T
      if (multiple) {
        (setSelected as (value: T[]) => void)([...(selected as T[]), created])
      } else {
        (setSelected as (value: T | null) => void)(created)
      }
      setIsCreating(false)
      setInputValue('')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmEdit = async () => {
    if (!inputValue.trim() || !editTarget || !editEndpoint) return
    setIsSaving(true)
    try {
      const data = await axiosManager(
        resolveEditEndpoint(editEndpoint, editTarget.id),
        getPayload(inputValue.trim()),
        { method: 'patch', useAccessToken: true }
      )
      const updated = data as T
      if (multiple) {
        (setSelected as (value: T[]) => void)(
          (selected as T[]).map(item => item.id === editTarget.id ? updated : item)
        )
      } else {
        (setSelected as (value: T | null) => void)(updated)
      }
      setIsEditing(false)
      setInputValue('')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsCreating(false)
    setIsEditing(false)
    setInputValue('')
  }

  const btnClass =
    'p-1.5 rounded-lg ring-1 ring-primary-400 transition duration-200 ' +
    'enabled:hover:bg-primary-100 enabled:hover:text-primary-700 ' +
    'dark:enabled:hover:bg-primary-800 dark:enabled:hover:text-white ' +
    'disabled:opacity-30 disabled:cursor-not-allowed'

  const isInlineMode = isCreating || isEditing

  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1">
        {isInlineMode ? (
          <input
            type="text"
            className={
              'transition duration-200 focus:ring-2 focus:ring-primary focus:outline-hidden appearance-none w-full ' +
              'leading-6 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-200 ' +
              'rounded-md py-2 px-2 ring-1 ring-slate-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 ' +
              'dark:ring-zinc-600 dark:focus:ring-primary-600 bg-white dark:bg-transparent'
            }
            placeholder={isCreating ? createPlaceholder : editPlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                isCreating ? handleConfirmCreate() : handleConfirmEdit()
              }
              if (e.key === 'Escape') handleCancel()
            }}
            autoFocus
          />
        ) : multiple ? (
          <Autocomplete<T>
            {...autocompleteProps}
            multiple
            selected={selected as T[]}
            setSelected={setSelected as (value: T[]) => void}
            onItemSelected={onItemSelected as ((value: T[]) => void) | undefined}
          />
        ) : (
          <Autocomplete<T>
            {...autocompleteProps}
            selected={selected as T | null}
            setSelected={setSelected as (value: T | null) => void}
            onItemSelected={onItemSelected as ((value: T | null) => void) | undefined}
          />
        )}
      </div>

      <div className="flex gap-1.5 mt-1">
        {isInlineMode ? (
          <>
            <button
              type="button"
              title="Confirmar"
              disabled={!inputValue.trim() || isSaving}
              onClick={isCreating ? handleConfirmCreate : handleConfirmEdit}
              className={btnClass}
            >
              {isSaving ? <Spinner size="sm" /> : <CheckIcon className="size-5 fill-primary" />}
            </button>
            <button
              type="button"
              title="Cancelar"
              disabled={isSaving}
              onClick={handleCancel}
              className={btnClass}
            >
              <XMarkIcon className="size-5 fill-primary" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              title="Agregar nuevo registro"
              onClick={() => {
                setIsCreating(true)
                setIsEditing(false)
                setInputValue('')
              }}
              className={btnClass}
            >
              <PlusIcon className="size-5 fill-primary" />
            </button>
            {editEndpoint !== undefined && (
              <button
                type="button"
                title="Editar registro seleccionado"
                disabled={editTarget === null}
                onClick={() => {
                  setIsEditing(true)
                  setIsCreating(false)
                  setInputValue(editTarget ? resolveDisplayValue(editTarget) : '')
                }}
                className={btnClass}
              >
                <PencilSquareIcon className="size-5 fill-primary" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default EditableAutocomplete
