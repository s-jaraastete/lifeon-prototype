import { CheckIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { ReactNode } from 'react'

type CounterVerticalStepProps = {
  step: number
  currentStep: number,
  lastStep?: never
}

type NoIconVerticalStepProps = {
  step?: never
  currentStep?: never
  lastStep: boolean
}

type VerticalStepProps = (CounterVerticalStepProps | NoIconVerticalStepProps) & {
  title: string | ReactNode,
  description?: string
  children?: ReactNode
}

export const VerticalStep = (props: VerticalStepProps) => {
  const stepDone = props.step !== undefined ? props.step < props.currentStep : false
  const notAvailable = props.step !== undefined ? props.step > props.currentStep: false
  const forceHide = props.lastStep !== undefined && props.lastStep
  
  return (
    <div className='relative group/stepper'>
      <div className='flex min-w-0 gap-3'>
        <div>
          <div 
            data-not-available={notAvailable} 
            data-step-done={stepDone}
            className={clsx(
              'w-[2rem] h-[2rem]',
              'data-[not-available=true]:text-gray-300 flex items-center justify-center rounded-full font-semibold',
              'data-[step-done=true]:bg-primary',
              props.step !== undefined ? 'border-2 border-primary text-primary data-[not-available=true]:border-gray-300': ''
            )}>
            {props.step !== undefined && stepDone ? <CheckIcon className='w-5 h-5 text-white'/> : props.step}
            {props.step === undefined && <div className='w-[0.75rem] h-[0.75rem] bg-gray-300 rounded-full'/>}
          </div>
        </div>
        <div className='min-w-0 flex-1'>
          {typeof(props.title) === 'string' ?
            <p data-active={props.step === props.currentStep} className='font-semibold pt-1 data-[active=true]:text-primary'>
              {props.title}
            </p>
            :
            <div className='pt-1'>{props.title as ReactNode}</div>
          }
          {props.children}
          {props.description && <p className='text-sm'>{props.description}</p>}
        </div>
      </div>
      {!forceHide && (
        <div data-step-done={stepDone} data-step-counter={props.step !== undefined}
        className={clsx(
          'w-0.5 data-[step-done=true]:bg-primary data-[step-done=false]:bg-gray-300 absolute inset-y-0 left-[0.97rem]',
          'data-[step-counter=true]:top-[2rem] top-[1rem] data-[step-counter=true]:h-[calc(100%-1rem)] h-[calc(100%+0.75rem)] group-last/stepper:hidden'
      )}/>
      )}
    </div>
  )
}

type VerticalStepperProps = {
  children: React.ReactNode
}

const VerticalStepper = (props: VerticalStepperProps) => (
  <div className="flex flex-col gap-4">
    {props.children}
  </div>
);

export default VerticalStepper