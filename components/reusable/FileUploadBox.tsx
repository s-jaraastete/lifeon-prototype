import LoadingState from '@/app/components/generic/LoadingState'
import { DocumentIcon, DocumentPlusIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useState, ChangeEvent, useCallback } from 'react'
import Spinner from './Spinner'

type SingleUploadFileBoxProps = {
  file: File | null,
  setFile: (file: File | null) => void,
  multiple?: never
}

type MultipleUploadFileBoxProps = {
  files: File[],
  setFiles: (files: File[]) => void,
  multiple: true
}

type FileUploadBoxProps = (SingleUploadFileBoxProps | MultipleUploadFileBoxProps) & {
  fileInputRef: React.RefObject<HTMLInputElement | null>,
  name: string
  description?: string
  loading?: boolean
  disabled?: boolean
  disabledMessage?: string
  accept?: string
  required?: boolean
}

const FileUploadBox = ({fileInputRef, ...props}: FileUploadBoxProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const isInteractionBlocked = Boolean(props.loading || props.disabled)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files.length === 0) {
      return
    }
    if (props.multiple) {
      props.setFiles(Array.from(e.target.files))
    } else {
      props.setFile(e.target.files[0])
    }
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (isInteractionBlocked) {
      return
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (props.multiple) {
        props.setFiles(Array.from(e.dataTransfer.files))
      } else {
        props.setFile(e.dataTransfer.files[0])
      }
      fileInputRef.current!.files = e.dataTransfer.files
      e.dataTransfer.clearData()
    }
  }, [isInteractionBlocked, props.multiple])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (isInteractionBlocked) {
      return
    }
    setIsDragging(true)
  }, [isInteractionBlocked])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])
  
  return (
    <>
      <div
        data-disabled={isInteractionBlocked}
        className={clsx(
          'h-50 w-full rounded-lg flex items-center justify-center flex-col text-center p-4 border-1 border-dashed transition',
          isDragging ? 'bg-blue-100 border-blue-300' : 'bg-gray-100 border-gray-300 hover:border-gray-500',
          'data-[disabled=true]:text-gray-400 data-[disabled=true]:hover:border-gray-300 data-[disabled=true]:bg-gray-100'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!isInteractionBlocked) {
            fileInputRef.current?.click()
          }
        }}
        style={{ cursor: isInteractionBlocked ? 'not-allowed' : 'pointer' }}
      >
        {!props.loading ?
          <DocumentPlusIcon className={clsx('w-8 h-8', isInteractionBlocked ? 'text-gray-400' : 'text-slate-800')}/>
          :
          <Spinner color='disabled'/>
        }
        <p className='pt-2'>
          {props.loading
            ? 'Cargando, por favor espere...'
            : props.disabled
              ? (props.disabledMessage ?? 'No disponible en este momento')
              : 'Clic para seleccionar archivo o arrastre aquí'}
        </p>
        <p className='text-sm/6'>{props.description}</p>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileChange}
          name={props.name}
          multiple={props.multiple}
          disabled={isInteractionBlocked}
          accept={props.accept}
          required={props.required}
        />
        {(props.multiple ? props.files.length > 0 : props.file) && 
          <span className='flex gap-1 pt-2 items-center'>
            <div><DocumentIcon className='w-4 h-4 text-green-700'/></div>
            <p className='text-sm text-green-700'>
              {props.multiple 
              ? `${props.files.length} archivo${props.files.length > 1 ? 's' : ''} seleccionado${props.files.length > 1 ? 's' : ''}` 
              : (props.file?.name ?? '-')}
            </p>
          </span>
        }
      </div>
    </>
  )
}

export default FileUploadBox