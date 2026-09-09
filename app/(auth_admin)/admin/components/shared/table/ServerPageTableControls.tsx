'use client'

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { ReactNode } from 'react';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Modal, { ModalActionButtons, ModalBody, ModalTitle } from '@/components/reusable/Modal';
import TextInput from '@/components/reusable/TextInput';
import Button from '@/components/reusable/Button';

type PaginationButtonProps = {
  href?: string
  active?: boolean
  disabled?: boolean
  icon?: boolean
  children: ReactNode
  'aria-label'?: string
  className?: string
  onClick?: () => void
}

const paginationClass = (active?: boolean, disabled?: boolean, icon?: boolean, className?: string) =>
  clsx(
    'inline-flex h-8 items-center justify-center rounded-lg text-body-sm font-medium leading-none transition-colors',
    icon ? 'w-8' : 'min-w-8 px-2.5',
    disabled && 'cursor-not-allowed bg-gray-100 text-gray-400',
    !disabled && active && 'bg-secondary-50 text-secondary-700',
    !disabled && !active && 'cursor-pointer border border-gray-300 bg-white text-gray-800 hover:bg-gray-100',
    className,
  )

const PaginationButton = ({href, active, disabled, icon, children, className, onClick, ...props}: PaginationButtonProps) => {
  const styles = paginationClass(active, disabled, icon, className)
  if (disabled || !href) {
    return (
      <button type='button' disabled={disabled} className={styles} onClick={onClick} {...props}>
        {children}
      </button>
    )
  }
  return (
    <Link href={href} className={styles} {...props}>
      {children}
    </Link>
  )
}

type PageJumpInputProps = {
  lastPage: number;
  createPageURL: (page: number) => string;
}

const PageJumpInput = ({ lastPage, createPageURL }: PageJumpInputProps) => {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleOpen = () => {
    setValue('');
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleClose = () => {
    setOpen(false);
    setValue('');
  };

  const handleConfirm = () => {
    const n = parseInt(value, 10);
    if (!isNaN(n)) {
      const clamped = Math.min(Math.max(n, 1), lastPage);
      router.push(createPageURL(clamped));
    }
    handleClose();
  };

  return (
    <>
      <button
        type='button'
        onClick={handleOpen}
        aria-label='Ir a la página'
        className='px-1 text-body-sm leading-[22px] text-gray-600 hover:text-gray-950 cursor-pointer'
      >
        ...
      </button>
      <Modal open={open} onClose={handleClose} size='xs'>
        <ModalTitle>Ir a la página</ModalTitle>
        <ModalBody>
          <TextInput
            ref={inputRef}
            type='number'
            value={value}
            min={1}
            max={lastPage}
            placeholder={`1 – ${lastPage}`}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleConfirm();
              if (e.key === 'Escape') handleClose();
            }}
          />
        </ModalBody>
        <ModalActionButtons>
          <Button variant='outline' onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Ir
          </Button>
        </ModalActionButtons>
      </Modal>
    </>
  );
};

type ServerPageTableControlsProps = {
  totalCount: number,
  pageSize: number,
}

const ServerPageTableControls = ({totalCount, pageSize}: ServerPageTableControlsProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;
  const lastPage = Math.ceil(totalCount / pageSize);
  const atStart = currentPage <= 1 || lastPage === 0
  const atEnd = currentPage >= lastPage || lastPage === 0

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className='flex items-center gap-2'>
      <PaginationButton
        href={createPageURL(1)}
        aria-label='Primera página'
        disabled={atStart}
        icon
      >
        <ChevronDoubleLeftIcon className='size-4' />
      </PaginationButton>
      <PaginationButton
        href={createPageURL(currentPage - 1)}
        aria-label='Página anterior'
        disabled={atStart}
        icon
      >
        <ChevronLeftIcon className='size-4' />
      </PaginationButton>
      {lastPage <= 5 ? (
        Array.from({ length: lastPage }, (_, i) => (
          <PaginationButton
            key={i + 1}
            href={createPageURL(i + 1)}
            active={currentPage === i + 1}
          >
            {i + 1}
          </PaginationButton>
        ))
      ) : (
      <>
        <PaginationButton href={createPageURL(1)} active={currentPage === 1}>
          1
        </PaginationButton>
        {currentPage > 3 && <PageJumpInput lastPage={lastPage} createPageURL={createPageURL} />}
        {currentPage > 2 && currentPage < lastPage - 1 && (
        <>
          <PaginationButton href={createPageURL(currentPage - 1)}>
            {currentPage - 1}
          </PaginationButton>
          <PaginationButton href={createPageURL(currentPage)} active>
            {currentPage}
          </PaginationButton>
          <PaginationButton href={createPageURL(currentPage + 1)}>
            {currentPage + 1}
          </PaginationButton>
        </>
        )}
        {currentPage <= 2 && (
        <>
          <PaginationButton href={createPageURL(2)} active={currentPage === 2}>
            2
          </PaginationButton>
          <PaginationButton href={createPageURL(3)} active={currentPage === 3}>
            3
          </PaginationButton>
        </>
        )}
        {currentPage >= lastPage - 2 && (
        <>
          <PaginationButton href={createPageURL(lastPage - 2)} active={currentPage === lastPage - 2}>
            {lastPage - 2}
          </PaginationButton>
          <PaginationButton href={createPageURL(lastPage - 1)} active={currentPage === lastPage - 1}>
            {lastPage - 1}
          </PaginationButton>
        </>
        )}
        {currentPage < lastPage - 2 && <PageJumpInput lastPage={lastPage} createPageURL={createPageURL} />}
        <PaginationButton href={createPageURL(lastPage)} active={currentPage === lastPage}>
          {lastPage}
        </PaginationButton>
      </>
      )}
      <PaginationButton
        href={createPageURL(currentPage + 1)}
        aria-label='Página siguiente'
        disabled={atEnd}
        icon
      >
        <ChevronRightIcon className='size-4' />
      </PaginationButton>
      <PaginationButton
        href={createPageURL(lastPage)}
        aria-label='Última página'
        disabled={atEnd}
        icon
      >
        <ChevronDoubleRightIcon className='size-4' />
      </PaginationButton>
    </div>
  )
}

export default ServerPageTableControls
