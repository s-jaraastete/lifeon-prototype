import {LinkProps as NextLinkProps, default as NextLink} from 'next/link'
import LoadingLinkHelper from './LoadingLinkHelper'

type LinkProps = NextLinkProps & {
  children: React.ReactNode,
  className?: string
}

const Link = ({children, ...props}: LinkProps) => {
  
  return (
    <NextLink {...props}>
      {children}
      <LoadingLinkHelper />
    </NextLink>
  )
}

export default Link