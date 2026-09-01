import {ChangeEvent, useState} from "react";
import {ArrowTopRightOnSquareIcon, CameraIcon, TrashIcon} from "@heroicons/react/24/solid";
import Image from "next/image";
import Button from "./Button";
import RemoveAttachedImageModal from "@/components/reusable/attach_photo_button/RemoveAttachedImageModal";

interface AttachPhotoButtonProps {
  fileKey: string,
  label?: string,
  file: File | null,
  setFile: (value: File | null) => void,
  afterChange?: () => void,
  urlFile?: string | null
}

const AttachPhotoButton = (props: AttachPhotoButtonProps) => {
  const [urlFile, setUrlFile] = useState<string | null>(props.urlFile ?? null)
  const [openRemoveImageModal, setOpenRemoveImageModal] = useState<boolean>(false)

  const handleFileChange = (e: ChangeEvent) => {
    if (props.file !== null && e.target.files.length === 0) return;
    props.setFile(e.target.files[0])
    setUrlFile(URL.createObjectURL(e.target.files[0]))
    props.afterChange?.()
  }

  return (
    <>
      <RemoveAttachedImageModal open={openRemoveImageModal} setOpen={setOpenRemoveImageModal} setFile={props.setFile} setUrl={setUrlFile}/>
      {!urlFile ?
        <label htmlFor={`${props.fileKey}-photo-id`} className='w-full mt-1 h-[150px] border border-solid hover:border-primary rounded-lg hover:bg-primary-50
             transition duration-300 text-slate-600 hover:text-primary flex justify-center items-center cursor-pointer'>
          <div className='flex gap-2'>
            <input id={`${props.fileKey}-photo-id`} type='file' className='hidden' onChange={handleFileChange} accept="image/png, image/gif, image/jpeg"/>
            <div className='w-6 h-6'><CameraIcon/></div>
            <span>{props.label ?? 'Adjuntar Foto'}</span>
          </div>
        </label>
        :
        <>
          <div className='flex justify-center mt-4'>
            <div className='relative w-[250px] h-[250px]'>
              <Image fill src={urlFile} alt='' className='object-cover rounded'/>
            </div>
          </div>
          <div className='flex justify-center flex-wrap gap-2 my-10'>
            <a href={urlFile} target='_blank'>
              <Button variant='light' icon={<ArrowTopRightOnSquareIcon/>}>
                Visualizar en otra Pestaña
              </Button>
            </a>
            <div>
              <label htmlFor={`${props.fileKey}-photo-id`} className='btn-common btn-primary-light'>
                <div className='flex gap-2'>
                  <input id={`${props.fileKey}-photo-id`} type='file' className='hidden' onChange={handleFileChange} accept="image/png, image/gif, image/jpeg"/>
                  <div className='w-6 h-6'><CameraIcon/></div>
                  <span>Reemplazar</span>
                </div>
              </label>
            </div>
            <Button variant='light' color='danger' icon={<TrashIcon/>} onClick={() => setOpenRemoveImageModal(true)}>
              Eliminar
            </Button>
          </div>
        </>
      }
    </>
  )
}

export default AttachPhotoButton