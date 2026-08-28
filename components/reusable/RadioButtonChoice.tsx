import { RadioGroup, Field, Radio, Label as HeadlessLabel } from '@headlessui/react'
import { clsx } from 'clsx'

export type RadioButtonOptions = {
  value: string,
  label: string
}

type NullAvailableRadioButtonChoiceProps = {
  selected: RadioButtonOptions | null,
  setSelected: (value: RadioButtonOptions | null) => void
  defaultIndex?: never
}

type NonNullAvailableRadioButtonChoiceProps = {
  selected: RadioButtonOptions,
  setSelected: (value: RadioButtonOptions) => void
  defaultIndex: number
}

type RadioButtonChoiceProps = (NullAvailableRadioButtonChoiceProps | NonNullAvailableRadioButtonChoiceProps) & {
  options: RadioButtonOptions[],
  direction?: 'row' | 'column'
}

const RadioButtonChoice = (props: RadioButtonChoiceProps) => {

  const handleChange = (value: string | null) => {
    if (props.defaultIndex === undefined) {
      props.setSelected(props.options.find(option => option.value === value) ?? null);
    }
    else {
      props.setSelected(props.options.find(option => option.value === value) ?? props.options[props.defaultIndex]);
    }
  }

  return (
    <RadioGroup value={props.selected?.value ?? null} onChange={handleChange} aria-label="Server size" className={clsx(
      'flex',
      props.direction === 'row' ? 'flex-row gap-6' : 'flex-col gap-1'
    )}>
      {props.options.map((option) => (
        <Field key={`option-key-${option.value}`} className={clsx("flex items-start group cursor-pointer")}>
          <Radio
            value={option.value}
            className={clsx(
              'group mt-0.5 self-start inline-flex h-4.5 w-4.5 shrink-0 grow-0 aspect-square items-center justify-center rounded-full border bg-white data-checked:bg-primary-600',
              'data-checked:border-primary-700/20 transition duration-100 group-hover:border-primary-600'
            )}
          >
            <span className="invisible size-1.5 rounded-full bg-white group-data-checked:visible" />
          </Radio>
          <HeadlessLabel className='cursor-pointer pl-2 p'>{option.label}</HeadlessLabel>
        </Field>
      ))}
    </RadioGroup>
  )
}

export default RadioButtonChoice