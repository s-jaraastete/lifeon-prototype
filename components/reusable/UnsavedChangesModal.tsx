'use client'

import Button from '@/components/reusable/Button'
import Modal, { ModalActionButtons, ModalBody, ModalTitle } from '@/components/reusable/Modal'
import { ArrowRightCircleIcon, BookmarkSquareIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { ReactNode } from 'react'

type UnsavedChangesModalProps = {
  open: boolean
  onCancel: () => void
  onProceed: () => void
  onSave?: () => void
  isSaving?: boolean
  /** Replaces the default modal body when provided. */
  message?: ReactNode
}

const UnsavedChangesModal = (props: UnsavedChangesModalProps) => {
  const isSaving = props.isSaving ?? false
  const canSave = typeof props.onSave === 'function'

  const handleClose = () => {
    if (isSaving) return
    props.onCancel()
  }

  return (
    <Modal open={props.open} onClose={handleClose} size='md'>
      <ModalTitle>
        <div className='flex gap-2 items-center text-red-600'>
          <ExclamationTriangleIcon className='size-6' />
          <span>Cambios sin guardar</span>
        </div>
      </ModalTitle>
      <ModalBody>
        {props.message ?? (
          <>
            <p>
              Tiene cambios sin guardar. Si abandona esta página perderá los cambios realizados.
            </p>
            {canSave ? (
              <p className='pt-2'>
                ¿Desea guardar los cambios antes de salir?
              </p>
            ) : null}
          </>
        )}
      </ModalBody>
      <ModalActionButtons>
        <Button variant='subtle' onClick={handleClose} icon={<XMarkIcon />} disabled={isSaving}>
          Cancelar
        </Button>
        <Button variant='light' onClick={props.onProceed} icon={<ArrowRightCircleIcon />} disabled={isSaving}>
          Continuar sin Guardar
        </Button>
        {canSave ? (
          <Button color='danger' icon={<BookmarkSquareIcon className='size-6' />} onClick={props.onSave} loading={isSaving}>
            Guardar y Continuar
          </Button>
        ) : null}
      </ModalActionButtons>
    </Modal>
  )
}

export default UnsavedChangesModal
