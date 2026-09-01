import { TextInputProps } from './TextInput';
import clsx from 'clsx'

interface ItemDescriptionProps {
  label: string,
  value: string | number,
  fullHeight?: boolean,
  whitespace?: boolean,
  onClick?: () => void,
}

const ItemDescription = (props: ItemDescriptionProps) => {
  const {onClick} = props;
  const clickprop = (): TextInputProps => onClick?({ onClick }): ({});

  return (
    <div className={`flex flex-col ${onClick && 'cursor-pointer'}`} {...clickprop()}>
      <p className='font-semibold text-gray-600'>
        {props.label}
      </p>
      <div className={clsx(
          'ring-1 ring-gray-200 rounded-sm p-2 text-gray-600',
          props.fullHeight ? 'h-full' : '',
          props.whitespace ? 'whitespace-pre-line' : ''
        )
      }>
        {props.value}
      </div>
    </div>
  )
}

export default ItemDescription