import { ReactNode } from 'react';
import { TooltipContent, TooltipTrigger, Tooltip as ShadcnTooltip } from '../ui/tooltip';

type TooltipProps = {
  children: ReactNode;
  content: ReactNode;
  asChild?: boolean
  delayDuration?: number
}

const Tooltip = (props: TooltipProps) => {
  
  return (
    <>
      <ShadcnTooltip delayDuration={props.delayDuration}>
        <TooltipTrigger asChild>{props.children}</TooltipTrigger>
        <TooltipContent>
          {props.content}
        </TooltipContent>
      </ShadcnTooltip>
    </>
  )
}

export default Tooltip
