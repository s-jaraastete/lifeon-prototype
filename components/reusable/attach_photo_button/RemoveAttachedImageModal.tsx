"use client"

import Modal, {ModalActionButtons, ModalBody, ModalTitle, ModalProps} from "./../Modal";
import {ExclamationTriangleIcon, TrashIcon} from "@heroicons/react/24/solid";
import Button from "./../Button";
import React from "react";

interface RemoveAttachedImageModalProps extends Omit<ModalProps, 'children' | 'onClose'> {
  setOpen: (open: boolean) => void,
  setFile: (value: File | null) => void,
  setUrl: (value: string | null) => void
}

const RemoveAttachedImageModal = (props: RemoveAttachedImageModalProps) => {
  const handleClose = () => {
    props.setOpen(false)
  }

  const handleRemove = async () => {
    props.setFile(null)
    props.setUrl(null)
    handleClose()
  }

  return (
    <Modal open={props.open} onClose={handleClose}>
      <ModalTitle>
        <div className='flex gap-2 items-center text-red-600'>
          <ExclamationTriangleIcon className='w-6 h-6'/>
          <span>Precaución</span>
        </div>
      </ModalTitle>
      <ModalBody>
        <p className='mb-2'>
          ¿Está seguro que desea eliminar el archivo adjunto?. Esta acción no se puede deshacer, ¿desea continuar?
        </p>
      </ModalBody>
      <ModalActionButtons>
        <Button variant='subtle' onClick={handleClose}>
          Cancelar
        </Button>
        <Button color='danger' icon={<TrashIcon/>} onClick={handleRemove}>
          Eliminar
        </Button>
      </ModalActionButtons>
    </Modal>
  )
}

export default RemoveAttachedImageModal