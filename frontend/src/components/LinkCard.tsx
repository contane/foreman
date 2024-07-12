import { ComponentPropsWithoutRef, FunctionComponent, PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

export const LinkCard: FunctionComponent<PropsWithChildren<{
  className?: string
}> & ComponentPropsWithoutRef<typeof Link>> = (props) => {
  return (
    <Link
      {...props}
      className={clsx(
        'block my-2 p-4 rounded bg-[#2b2d30] border-2 border-transparent hocus:border-white/25 outline-none',
        props.className
      )}
    >
      {props.children}
    </Link>
  )
}
